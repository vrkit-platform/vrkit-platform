
#include <fstream>
#include <iostream>
#include <magic_enum.hpp>

#include <google/protobuf/util/json_util.h>

#include <IRacingTools/SDK/Utils/CollectionHelpers.h>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>


namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  namespace {
    auto L = GetCategoryWithType<TelemetryDataService>();
  }

  TelemetryDataService::TelemetryDataService() : TelemetryDataService(Options{}) {
  }

  TelemetryDataService::TelemetryDataService(const Options &options)
      : Service(PrettyType<TelemetryDataService>{}.name()), options_(options) {
    reset();
  }

  void TelemetryDataService::reset(bool skipPrepare) {
    auto onReadHandler =
        [&](std::vector<std::shared_ptr<IRacingTools::Models::Telemetry::TelemetryDataFile>> &dataFiles) {
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

      for (auto &watcher: fileWatchers_) {
        watcher->stop();
      }

      filePaths_.clear();

      // NOW PREPARE
      if (!skipPrepare) {
        dataFileHandler_ = std::make_unique<Utils::JSONLinesMessageFileHandler<TelemetryDataFile>>(
            options_.dataFile.value_or(GetAppDataPath() / TrackDataPath));

        filePaths_ = options_.ibtPaths.empty() ? std::vector<fs::path>{GetIRacingTelemetryPath()} : options_.ibtPaths;

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

    auto res = dataFileHandler_->read();

    if (!res && res.error().code() != SDK::ErrorCode::NotFound) {
      return std::unexpected(res.error());
    }

    for (auto &path: filePaths_) {
      L.info("Creating watcher @ {}", path.string());
      fileWatchers_.push_back(std::make_unique<FileSystem::FileWatcher>(
          path.wstring(), [&](const FileSystem::FileWatcher::WatchEventData &file, FileSystem::WatchEvent eventType) {
            std::scoped_lock lock(stateMutex_);
            L.info("EVENT({}) FILE({}) PATH({})", std::string(magic_enum::enum_name(eventType).data()),
                    file.path.string(), path.string());
            if (eventType == FileSystem::WatchEvent::Removed) {
              return;
            }
          }));
    }

    return true;
  }

  std::expected<bool, SDK::GeneralError> TelemetryDataService::start() {
    std::scoped_lock lock(stateMutex_);

    if (state() >= State::Starting)
      return state() == State::Running;

    setState(State::Starting);
    for (auto &watcher: fileWatchers_) {
      watcher->start();
    }
      
    setState(State::Running);
    return std::expected<bool, SDK::GeneralError>();
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


  std::vector<fs::path> TelemetryDataService::listAvailableIBTFiles() {
    return ListAllFilesRecursively(filePaths_);
  }
  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> TelemetryDataService::load(bool reload) {
    auto res = dataFileHandler_->read();
    if (!res) {
      return std::unexpected(res.error());
    }

    return shared_from_this();
  }

  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> TelemetryDataService::save() {

    auto res = dataFileHandler_->write(toDataFileList());

    if (!res) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "Unknown"));
    }

    return shared_from_this();
  }

  std::size_t TelemetryDataService::size() {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.size();
  }

  std::vector<std::shared_ptr<TelemetryDataFile>> TelemetryDataService::toDataFileList() {
    std::scoped_lock lock(stateMutex_);

    return SDK::Utils::ValuesOf(dataFiles_);
  }

  bool TelemetryDataService::exists(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.contains(nameOrAlias);
  }

  std::optional<fs::path> TelemetryDataService::findFile(const std::shared_ptr<TelemetryDataFile> &dataFile) {
    for (auto &filePath: filePaths_) {
      auto file = filePath / dataFile->filename();
      if (fs::exists(file)) {
        return file;
      }
    }

    return std::nullopt;
  }

  bool TelemetryDataService::isAvailable(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return findFile(dataFiles_[nameOrAlias]).has_value();
    }

    return false;
  }

  std::shared_ptr<TelemetryDataFile> TelemetryDataService::get(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return dataFiles_[nameOrAlias];
    }
    return std::shared_ptr<TelemetryDataFile>();
  }

  std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
  TelemetryDataService::set(const std::shared_ptr<TelemetryDataFile> &config) {
    return set(config->id(), config);
  }

  std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
  TelemetryDataService::set(const std::string &id, const std::shared_ptr<TelemetryDataFile> &config) {
    std::scoped_lock lock(stateMutex_);
    auto newDataFiles = dataFiles_;
    newDataFiles[id] = config;

    auto res = dataFileHandler_->write(SDK::Utils::ValuesOf(newDataFiles));
    if (!res.has_value()) {
      return std::unexpected(res.error());
    }
    dataFiles_ = std::move(newDataFiles);
    return dataFiles_[id];
  }


}// namespace IRacingTools::Shared::Services
