
#include <chrono>
#include <magic_enum.hpp>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/RunnableThread.h>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

#include "TelemetryDataFileProcessor.h"

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  namespace {
    auto L = GetCategoryWithType<TelemetryDataService>();

  } // namespace


  TelemetryDataService::~TelemetryDataService() {
    destroy();
  }

  TelemetryDataService::TelemetryDataService(
      const std::shared_ptr<ServiceContainer> &serviceContainer)
      : TelemetryDataService(serviceContainer, Options{}) {
  }

  TelemetryDataService::TelemetryDataService(
      const std::shared_ptr<ServiceContainer> &serviceContainer,
      const Options &options)
      : Service(serviceContainer, PrettyType<TelemetryDataService>{}.name()),
        options_(options) {
    fileTaskQueue_ = std::make_unique<TaskQueueType>(
            [&](fs::path file, std::shared_ptr<TelemetryDataFile> dataFile) -> TQReturnType {
              return taskQueueFn(file,dataFile);
            });
    reset();
  }

  void TelemetryDataService::reset(bool skipPrepare) {
    auto onReadHandler =
        [&](const std::vector<std::shared_ptr<
                IRacingTools::Models::TelemetryDataFile>> &dataFiles) {
          std::scoped_lock lock(stateMutex_);
          dataFiles_.clear();
          for (auto &dataFile: dataFiles) {
            dataFiles_[dataFile->id()] = dataFile;
          }
        };
    {
      std::scoped_lock lock(stateMutex_);

      // CLEANUP FIRST
      if (dataFileHandler_) {
        dataFileHandler_.release();
      }

      // if (fileTaskQueue_) {
      //   fileTaskQueue_->destroy();
      // }

      // for (auto &watcher: fileWatchers_) {
      //   watcher->stop();
      // }

      filePaths_.clear();

      // NOW PREPARE
      if (!skipPrepare) {
        dataFileHandler_ = std::make_unique<
            Utils::JSONLinesMessageFileHandler<TelemetryDataFile>>(
            options_.jsonlFile.value_or(GetAppDataPath() / TelemetryDataFileJSONLFilename));

        filePaths_ = options_.ibtPaths.empty()
                         ? std::vector<fs::path>{GetIRacingTelemetryPath()}
                         : options_.ibtPaths;

        dataFileHandler_->events.onRead.subscribe(onReadHandler);
      }
    }
  }

  void TelemetryDataService::setOptions(const Options &options) {
    std::scoped_lock lock(stateMutex_);
    options_ = options;
    reset();
  }

  std::expected<bool, SDK::GeneralError> TelemetryDataService::init() {
    std::scoped_lock lock(stateMutex_);

    // READ THE UNDERLYING DATA FILE, THE RESULT (IF SUCCESSFUL) IS HANDLED BY
    // THE `onRead` EVENT HANDLER
    L->info(
        "Reading telemetry data jsonl file: {}",
        dataFileHandler_->file().string());

    auto loadError = load(true);
    if (loadError.has_value()) {
      return std::unexpected(loadError.value());
    }


    // CREATE FILE WATCHERS
    for (auto &path: filePaths_) {
      L->info("Creating watcher @ {}", path.string());
      fileWatchers_.push_back(std::make_unique<FileSystem::FileWatcher>(
          path.wstring(),
          [&](const FileSystem::FileWatcher::WatchEventData &file,
              FileSystem::WatchEvent eventType) {
            auto eventMsg = std::format(
                "EVENT({}) FILE({}) PATH({})",
                std::string(magic_enum::enum_name(eventType).data()),
                file.path.string(),
                path.string());

            L->debug("FileWatcherEvent >> {}", eventMsg);

            if (eventType == FileSystem::WatchEvent::Removed) {
              return;
            }

            std::scoped_lock handlerLock(stateMutex_);
            enqueueFiles({file.path});
          }));
    }

    return true;
  }

  std::size_t TelemetryDataService::scanAllFiles(const std::optional<std::vector<std::filesystem::path>>& overrideFilePaths) {
    return enqueueFiles(listTelemetryFiles(!overrideFilePaths ? filePaths_ : overrideFilePaths.value()));
  }


  std::expected<bool, GeneralError> TelemetryDataService::start() {

    {
      std::scoped_lock lock(stateMutex_);

      if (state() >= State::Starting)
        return state() == State::Running;

      setState(State::Starting);

      // scanAllFiles();
    }

    // auto result = request->future.get();

    // START ALL FILE WATCHERS
    for (auto &watcher: fileWatchers_) {
      watcher->start();
    }

    setState(State::Running);


    return true;
  }

  std::optional<SDK::GeneralError> TelemetryDataService::destroy() {
    {
      std::scoped_lock lock(stateMutex_);
      if (state() >= State::Destroying)
        return std::nullopt;

      setState(State::Destroying);
    }
    reset(true);
    if (fileTaskQueue_) {
      fileTaskQueue_->destroy();
      fileTaskQueue_ = nullptr;
    }
    setState(State::Destroyed);
    return std::nullopt;
  }

  /**
   * @brief Remove underlying data file & clear the map
   *
   * @return std::optional<SDK::GeneralError>
   */
  std::optional<SDK::GeneralError>
  TelemetryDataService::clearTelemetryFileCache() {
    auto res = dataFileHandler_->clear();
    if (res) {
      L->error("Unable to remove underlying data file: {}", res.value().what());
      return res;
    }

    return std::nullopt;
  }

  bool TelemetryDataService::hasPendingTasks() {
    return fileTaskQueue_->hasPendingTasks();
  }

  std::size_t TelemetryDataService::pendingTaskCount() {
    return fileTaskQueue_->pendingTaskCount();
  }



  std::expected<std::shared_ptr<TrackLayoutMetadata>, GeneralError>
  TelemetryDataService::getTrackLayoutMetadata(
      const std::shared_ptr<TelemetryDataFile> &dataFile) {
    return getTrackLayoutMetadata(dataFile->file_info().file());
  }
  std::expected<std::shared_ptr<TrackLayoutMetadata>, GeneralError>
  TelemetryDataService::getTrackLayoutMetadata(const fs::path &file) {
    auto client = std::make_shared<SDK::DiskClient>(file, file.string());
    if (!client) {
      auto msg =
          std::format("Unable to create disk client ({})", file.string());
      return std::unexpected(GeneralError(ErrorCode::General, msg));
    }
    auto clientDisposer = gsl::finally([&] {
      if (client)
        client->close();
    });
    if (client->hasNext())
      client->next();

    std::shared_ptr<TrackLayoutMetadata> tlm{nullptr};
    {
      auto sessionInfo = client->getSessionInfo().lock();

      auto res = Utils::GetSessionInfoTrackLayoutMetadata(sessionInfo);
      if (!res) {
        auto msg = std::format(
            "Invalid IBT file, can not get track layout id: {}", file.string());
        L->warn(msg);
        return std::unexpected(GeneralError(ErrorCode::General, msg));
      }
      tlm = res.value();
    }

    return tlm;
  }
  std::size_t TelemetryDataService::enqueueFiles(const std::vector<fs::path>& files) {
    std::atomic_int queueCount = 0;
    {
      std::scoped_lock lock(stateMutex_);

      for (auto& file : files) {
        if (pendingFileMap_.contains(file.string()))
          continue;

        fs::path finalFile = file;
        if (!finalFile.is_absolute()) {
          finalFile = fs::absolute(file);
        }

        auto dataFile = getByFile(finalFile);
        if (dataFile) {
          auto tsRes = CheckFileInfoModified(dataFile, finalFile);
          if (!tsRes) {
            L->warn("Unable to check timestamps for {}: {}", finalFile.string(), tsRes.error().what());
            continue;
          }

          if (!tsRes.value().first) {
            continue;
          }
        }

        pendingFileMap_[file.string()] = fileTaskQueue_->enqueue(finalFile, dataFile);
        ++queueCount;
      }
    }

    return queueCount;
    // const auto queueFiles = std::ranges::unique(changedFiles);
  }
  TelemetryDataService::TQReturnType TelemetryDataService::taskQueueFn(fs::path file,std::shared_ptr<TelemetryDataFile> dataFile) {
    auto res = ProcessTelemetryDataFile(shared_from_this(), file, dataFile);
    if (!res) {
      L->error("Failed to process {}", file.string());
      events.onFilesChanged.publish(this, {});
      return nullptr;
    }
    auto tdf = res.value();
    if (tdf) {
      set(tdf);
    }

    return tdf;
  }

  std::vector<fs::path> TelemetryDataService::listTelemetryFiles(
    const std::optional<std::vector<std::filesystem::path>>& overrideFilePaths
  ) {
    
    return ListAllFilesRecursively(!overrideFilePaths ? filePaths_ : overrideFilePaths.value());
  }
  std::optional<SDK::GeneralError>
  TelemetryDataService::load(bool reload) {
    std::scoped_lock lock(stateMutex_);
    if (!reload && !dataFiles_.empty())
      return std::nullopt;

    auto res = dataFileHandler_->read();
    // IF THERE WAS AN ERROR, THEN RETURN HERE

    if (!res) { // && res.error().code() != SDK::ErrorCode::NotFound
      if (res.error().code() == ErrorCode::NotFound)
        L->info("Creating new telemetry data file");
      else
        return res.error();
    }

    return std::nullopt;
  }

  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError>
  TelemetryDataService::save() {

    auto res = dataFileHandler_->write(toList());

    if (!res && res.error().code() != SDK::ErrorCode::NotFound)  {
      return std::unexpected(res.error());
    }

    return shared_from_this();
  }

  std::size_t TelemetryDataService::size() {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.size();
  }

  std::vector<std::shared_ptr<TelemetryDataFile>>
  TelemetryDataService::toList() {
    std::scoped_lock lock(stateMutex_);

    return SDK::Utils::ValuesOf(dataFiles_);
  }

  bool TelemetryDataService::exists(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.contains(nameOrAlias);
  }

  std::optional<fs::path> TelemetryDataService::findFile(
      const std::shared_ptr<TelemetryDataFile> &dataFile) {
    for (auto &filePath: filePaths_) {
      auto file = filePath / dataFile->file_info().filename();
      if (fs::exists(file)) {
        return file;
      }
    }

    return std::nullopt;
  }

  std::shared_ptr<TelemetryDataFile>
  TelemetryDataService::getByFile(const fs::path &file) {
    std::set<std::string> matchList{
        file.string(),
        file.filename().string(),
        Base64::encode(file.string()),
        Base64::encode(file.filename().string())};
    for (auto &[id, dataFile]: dataFiles_) {
      if (matchList.contains(id) ||
          matchList.contains(dataFile->file_info().filename()) ||
          matchList.contains(dataFile->id()) ||
          matchList.contains(dataFile->alias())) {
        return dataFile;
      }
    }

    return nullptr;
  }

  bool TelemetryDataService::isAvailable(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return findFile(dataFiles_[nameOrAlias]).has_value();
    }

    return false;
  }

  std::shared_ptr<TelemetryDataFile>
  TelemetryDataService::get(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return dataFiles_[nameOrAlias];
    }
    return nullptr;
  }

  std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
  TelemetryDataService::set(
      const std::shared_ptr<TelemetryDataFile> &dataFile,
      bool skipFileChangedEvent) {
    auto res = set(std::vector{dataFile}, skipFileChangedEvent);
    if (!res) {
      return std::unexpected(res.error());
    }

    auto &dataFiles = res.value();
    if (dataFiles.empty())
      return std::unexpected(SDK::GeneralError(
          ErrorCode::General, "No valid data files returned"));

    return dataFiles[0];
  }

  std::expected<
      const std::vector<std::shared_ptr<TelemetryDataFile>>,
      SDK::GeneralError>
  TelemetryDataService::set(
      const std::vector<std::shared_ptr<TelemetryDataFile>> &changedDataFiles,
      bool skipFileChangedEvent) {
    {

      std::scoped_lock lock(stateMutex_);
      if (!dataFileHandler_ || state() >= ServiceState::Destroying) {
        return std::unexpected(SDK::GeneralError(ErrorCode::General, "This service is being or has been destroyed"));
      }

      // COPY CURRENT MAP
      auto newDataFiles = dataFiles_;

      // TIMESTAMP UPDATED_AT

      // auto timestamp = TimeEpoch<std::chrono::milliseconds>().count();
      // dataFile->set_updated_at(timestamp);

      // SET MAPPING TO DATA FILE
      for (auto &dataFile: changedDataFiles) {
        newDataFiles[dataFile->id()] = dataFile;
      }

      // WRITE CHANGES TO DISK
      auto res = dataFileHandler_->write(SDK::Utils::ValuesOf(newDataFiles));

      // CHECK ERROR
      if (!res.has_value()) {
        return std::unexpected(res.error());
      }

      // MOVE NEW DATA FILES WITH CHANGES ON TO `dataFiles_` member
      dataFiles_ = std::move(newDataFiles);
    }

    if (!skipFileChangedEvent) {
      events.onFilesChanged.publish(this, changedDataFiles);
    }

    return changedDataFiles;
  }




} // namespace IRacingTools::Shared::Services
