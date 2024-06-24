#include <IRacingTools/Shared/Services/TrackMapDataService.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

#include <fstream>
#include <iostream>
#include <magic_enum.hpp>

#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <google/protobuf/util/json_util.h>

namespace IRacingTools::Shared::Services {

  TrackMapDataService::TrackMapDataService(token)
      : dataFileHandler_(GetAppDataPath() / TrackDataPath),
        filePaths_({GetUserDataPath(TracksPath), GetAppDataPath(TracksPath)}) {

    dataFileHandler_.events.onRead.subscribe([&](auto &dataFiles) {
      std::scoped_lock lock(persistMutex_);
      dataFiles_.clear();
      for (auto &dataFile: dataFiles) {
        dataFiles_[dataFile.id()] = dataFile;
      }
    });
  }


  std::expected<TrackMapDataService *, SDK::GeneralError> TrackMapDataService::save() {

    auto res = dataFileHandler_.write(toDataFileList());

    if (!res) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "Unknown"));
    }

    return this;
  }


  std::vector<TrackMapFile> TrackMapDataService::toDataFileList() {
    std::scoped_lock lock(persistMutex_);

    return SDK::Utils::ValuesOf(dataFiles_);
  }

  bool TrackMapDataService::exists(const std::string &nameOrAlias) {
    std::scoped_lock lock(persistMutex_);
    return dataFiles_.contains(nameOrAlias);
  }

  std::optional<fs::path> TrackMapDataService::findFile(const TrackMapFile& dataFile) {
    for (auto& filePath : filePaths_) {
      auto file = filePath / dataFile.filename();
      if (fs::exists(file)) {
        return file;
      }
    }

    return std::nullopt;
  }

  bool TrackMapDataService::isAvailable(const std::string &nameOrAlias) {
    std::scoped_lock lock(persistMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return findFile(dataFiles_[nameOrAlias]).has_value();
    }

    return false;
  }

  const TrackMapFile *TrackMapDataService::get(const std::string &nameOrAlias) {
    std::scoped_lock lock(persistMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return &dataFiles_[nameOrAlias];
    }
    return nullptr;
  }

  std::expected<const TrackMapFile *, SDK::GeneralError>
  TrackMapDataService::set(const TrackMapFile &config) {
    return set(config.id(), config);
  }

  std::expected<const TrackMapFile *, SDK::GeneralError>
  TrackMapDataService::set(const std::string &id, const TrackMapFile &config) {
    std::scoped_lock lock(persistMutex_);
    auto newDataFiles = dataFiles_;
    newDataFiles[id] = config;

    auto res = dataFileHandler_.write(SDK::Utils::ValuesOf(newDataFiles));
    if (!res.has_value()) {
      return std::unexpected(res.error());
    }
    dataFiles_ = std::move(newDataFiles);
    return &dataFiles_[id];
  }
}// namespace IRacingTools::Shared::Services
