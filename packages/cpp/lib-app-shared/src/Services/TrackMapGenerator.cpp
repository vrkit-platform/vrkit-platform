
#include "TrackMapGenerator.h"

#include <IRacingTools/SDK/DiskClient.h>
#include <chrono>
#include <fstream>
#include <functional>
#include <iostream>
#include <magic_enum.hpp>

#include <google/protobuf/util/json_util.h>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>


namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  using namespace IRacingTools::Shared::Utils;
  namespace {
    auto L = GetCategoryWithType<TrackMapService>();

  }

  std::string TrackLayoutIdToFilename(const std::string &trackLayoutId) {
    std::string rawFilename =
        std::format("{}{}", trackLayoutId, Extensions::TRACK_MAP);
    std::regex invalidCharsExp{"[\\s:]"};
    std::string filename =
        std::regex_replace(rawFilename, invalidCharsExp, "_");
    return filename;
  }

  using GenerateResult =
      std::expected<std::shared_ptr<TrackMapFile>, GeneralError>;

  GenerateResult GenerateTrackMap(
      const std::shared_ptr<ServiceContainer> &serviceContainer,
      std::shared_ptr<TelemetryDataFile> dataFile) {

    std::shared_ptr<TrackMapFile> tmFile{nullptr};
    auto onError = [&]<typename... Args>(
                       fmt::format_string<Args...> fmt,
                       Args &&...args) -> GenerateResult {
      std::string message = fmt::format(fmt, std::forward<Args>(args)...);
      L->error(message);
      if (tmFile) {
        // tmFile->set_status(
        //     TrackMapFile::STATUS_ERROR);
        return tmFile;
      }
      return std::unexpected(GeneralError(ErrorCode::General, message));
    };

    fs::path file{dataFile->file_info().file()};
    if (!fs::exists(file)) {
      return onError("File does not exist >> {}", file.string());
    }

    auto tmService = serviceContainer->getService<TrackMapService>();
    VRK_LOG_AND_FATAL_IF(!tmService, "Unable to get valid TrackMapService");

    L->info("Calling createLapTrajectory with ({})", file.string());


    // GET TRACK LAYOUT METADATA
    auto &tlm = dataFile->track_layout_metadata();

    auto &tlmId = tlm.id();
    auto tmCurrentFile = tmService->get(tlmId);

    tmFile = std::make_shared<TrackMapFile>();

    // IF AN EXISTING TrackMapFile EXISTS, THEN SEE IF WE NEED TO
    // REBUILD OR NOT
    // TODO: implement logic to check track version
    if (tmCurrentFile) {
      tmFile->CopyFrom(*tmCurrentFile);
      auto tsRes = CheckFileInfoModified(tmFile, dataFile->file_info().file());
      if (!tsRes.has_value()) {
        return std::unexpected(tsRes.error());
      }

      auto &[fileChanged, ts] = tsRes.value();

      if (!fileChanged) {
        L->debug("Ignoring track map file ({}) as it has already been "
                 "ingested & has not changed since");
        return tmFile;
      }
    }

    tmFile->mutable_track_layout_metadata()->CopyFrom(
        dataFile->track_layout_metadata());

    // CREATE DISK CLIENT
    auto client = std::make_shared<SDK::DiskClient>(file, file.string());
    auto clientDisposer = gsl::finally([&] {
      if (client)
        client->close();
    });

    // CREATE THE TRAJECTORY
    LapTrajectoryTool tool;
    auto res = tool.createLapTrajectory(client);
    if (!res) {
      auto err = res.error();
      return onError("Failed to generate lap trajectory >> {}", err.what());
    }

    // SET/PERSIST THE TRAJECTORY DATA
    auto &trackLayoutId = tmFile->track_layout_metadata().id();
    auto lt = res.value();
    L->info(
        "Created LapTrajectory for trackLayoutId ({})",
        lt->track_layout_metadata().id());

    auto ltPath = tmService->getFilePath();
    auto ltFilename = TrackLayoutIdToFilename(trackLayoutId);
    auto ltFile = ltPath / ltFilename;
    L->info(
        "Writing lap trajectory ({}) to: {}",
        lt->track_layout_metadata().id(),
        ltFile.string());

    if (!WriteMessageToFile(*lt, ltFile)) {
      L->error("Failed to write {}", ltFile.string());
      return onError("Failed to write to file > {}", ltFile.string());
    }

    auto fiRes = GetFileInfo(tmFile->mutable_file_info(), ltFile);
    if (!fiRes) {
      return onError("Failed to get file info for file > {}", ltFile.string());
    }


    L->info(
        "Saved LapTrajectory for trackLayoutId ({})",
        lt->track_layout_metadata().id());
    return tmFile;
  }
} // namespace IRacingTools::Shared::Services