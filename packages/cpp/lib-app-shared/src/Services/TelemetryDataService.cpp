
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


  TelemetryDataService::TelemetryDataService(
      const std::shared_ptr<ServiceContainer> &serviceContainer)
      : TelemetryDataService(serviceContainer, Options{}) {
  }

  TelemetryDataService::TelemetryDataService(
      const std::shared_ptr<ServiceContainer> &serviceContainer,
      const Options &options)
      : Service(serviceContainer, PrettyType<TelemetryDataService>{}.name()),
        options_(options) {
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

      if (processorThread_) {
        processorThread_->stop();
      }

      for (auto &watcher: fileWatchers_) {
        watcher->stop();
      }

      filePaths_.clear();

      // NOW PREPARE
      if (!skipPrepare) {
        processorThread_ = std::make_shared<TelemetryDataFileProcessor>(this);
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

    auto res = dataFileHandler_->read();

    // IF THERE WAS AN ERROR, THEN RETURN HERE
    if (!res && res.error().code() != SDK::ErrorCode::NotFound) {
      return std::unexpected(res.error());
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
            auto req = processorThread_->submitRequest({file.path});
            if (!req) {
              L->error("No request received for {}", file.path.string());
            } else {
              L->debug(
                  "FileWatcher submitted request for processing "
                  "(id={},file={})",
                  req->id,
                  file.path.string());
            }
          }));
    }

    return true;
  }

  std::expected<bool, GeneralError> TelemetryDataService::start() {
    std::shared_ptr<Request> request{nullptr};
    {
      std::scoped_lock lock(stateMutex_);

      if (state() >= State::Starting)
        return state() == State::Running;

      setState(State::Starting);

      // START THE PROCESSOR
      processorThread_->start();

      // SUBMIT A GLOBAL REQUEST

      request = processorThread_->submitRequest();
    }

    auto result = request->future.get();

    // START ALL FILE WATCHERS
    for (auto &watcher: fileWatchers_) {
      watcher->start();
    }

    setState(State::Running);


    return true;
  }

  std::optional<SDK::GeneralError> TelemetryDataService::destroy() {
    std::scoped_lock lock(stateMutex_);
    if (state() >= State::Destroying)
      return std::nullopt;

    setState(State::Destroying);
    reset(true);
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

  bool TelemetryDataService::isProcessing() {
    return processorThread_->isProcessing();
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

  std::vector<fs::path> TelemetryDataService::listTelemetryFiles() {
    return ListAllFilesRecursively(filePaths_);
  }
  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError>
  TelemetryDataService::load(bool reload) {
    auto res = dataFileHandler_->read();
    if (!res) {
      return std::unexpected(res.error());
    }

    return shared_from_this();
  }

  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError>
  TelemetryDataService::save() {

    auto res = dataFileHandler_->write(toList());

    if (!res) {
      return std::unexpected(
          SDK::GeneralError(SDK::ErrorCode::General, "Unknown"));
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

  using SubmitRequestResult = std::
      expected<TelemetryDataService::Result::SharedFuture, SDK::GeneralError>;


} // namespace IRacingTools::Shared::Services
