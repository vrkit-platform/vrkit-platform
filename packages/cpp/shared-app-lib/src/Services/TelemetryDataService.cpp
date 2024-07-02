
#include <fstream>
#include <iostream>
#include <magic_enum.hpp>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <google/protobuf/util/json_util.h>


namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;

  TelemetryDataService::TelemetryDataService(const Options &options)
      : dataFileHandler_(options.dataFile.value_or(GetAppDataPath() / TrackDataPath)),
        //GetUserDataPath(TracksPath), GetAppDataPath(TracksPath)
        filePaths_({GetIRacingTelemetryPath()}) {

    for (auto &path: options.searchPaths) {
      filePaths_.push_back(path);
    }

    dataFileHandler_.events.onRead.subscribe([&](auto &dataFiles) {
      std::scoped_lock lock(persistMutex_);
      dataFiles_.clear();
      for (auto &dataFile: dataFiles) {
        dataFiles_[dataFile->id()] = dataFile;
      }
    });
  }

  std::expected<bool, SDK::GeneralError> TelemetryDataService::init() {
    std::scoped_lock lock(persistMutex_);
    auto res = dataFileHandler_.read();
    if (!res && res.error().code() != SDK::ErrorCode::NotFound) {
      return std::unexpected(res.error());
    }
    for (auto &path: filePaths_) {
      fileWatchers_.push_back(std::make_unique<FileSystem::FileWatcher>(
          path.wstring(), [&](const FileSystem::FileWatcher::WatchEventData &file, FileSystem::WatchEvent eventType) {
            log::info("Telemetry file watcher ({}) > Event ({}) > File ({})", path.string(), file.path.string(),
                      magic_enum::enum_name(eventType).data());
          }));
    }

    return true;
  }

  std::expected<bool, SDK::GeneralError> TelemetryDataService::start() {
    return std::expected<bool, SDK::GeneralError>();
  }

  void TelemetryDataService::stop() {
  }

  void TelemetryDataService::destroy() {
  }


  std::vector<fs::path> TelemetryDataService::listAvailableIBTFiles() {
    return ListAllFilesRecursively(filePaths_);
  }
  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> TelemetryDataService::load(bool reload) {
    auto res = dataFileHandler_.read();
    if (!res) {
      return std::unexpected(res.error());
    }

    return shared_from_this();
  }

  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> TelemetryDataService::save() {

    auto res = dataFileHandler_.write(toDataFileList());

    if (!res) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "Unknown"));
    }

    return shared_from_this();
  }

  std::size_t TelemetryDataService::size() {
    std::scoped_lock lock(persistMutex_);
    return dataFiles_.size();
  }

  std::vector<std::shared_ptr<TelemetryDataFile>> TelemetryDataService::toDataFileList() {
    std::scoped_lock lock(persistMutex_);

    return SDK::Utils::ValuesOf(dataFiles_);
  }

  bool TelemetryDataService::exists(const std::string &nameOrAlias) {
    std::scoped_lock lock(persistMutex_);
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
    std::scoped_lock lock(persistMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return findFile(dataFiles_[nameOrAlias]).has_value();
    }

    return false;
  }

  std::shared_ptr<TelemetryDataFile> TelemetryDataService::get(const std::string &nameOrAlias) {
    std::scoped_lock lock(persistMutex_);
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
    std::scoped_lock lock(persistMutex_);
    auto newDataFiles = dataFiles_;
    newDataFiles[id] = config;

    auto res = dataFileHandler_.write(SDK::Utils::ValuesOf(newDataFiles));
    if (!res.has_value()) {
      return std::unexpected(res.error());
    }
    dataFiles_ = std::move(newDataFiles);
    return dataFiles_[id];
  }
}// namespace IRacingTools::Shared::Services
