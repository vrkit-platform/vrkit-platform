#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>

#include <fstream>
#include <iostream>
#include <magic_enum.hpp>


#include <google/protobuf/util/json_util.h>



namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;
  using namespace spdlog;

  namespace {
    auto L = GetCategoryWithType<LapTrajectoryTool>();
  }// namespace


  std::expected<std::shared_ptr<Models::LapTrajectory>, GeneralError>
  LapTrajectoryTool::createLapTrajectory(const std::filesystem::path &file, const CreateOptions& options) {
    auto client = std::make_shared<SDK::DiskClient>(file, file.string());
    return createLapTrajectory(client,options);
  }

  std::expected<std::shared_ptr<Models::LapTrajectory>, GeneralError>
  LapTrajectoryTool::createLapTrajectory(const std::shared_ptr<SDK::DiskClient> &client, const CreateOptions& options) {
    TelemetryFileHandler telemFile(client);
    auto lapsRes = telemFile.getLapData();
    if (!lapsRes) {
      return std::unexpected(lapsRes.error());
    }

    auto& laps = lapsRes.value();
    
    auto sessionInfo = client->getSessionInfo().lock();
    if (!sessionInfo) {
      return std::unexpected(GeneralError(ErrorCode::General, "session info from weak ptr was not available"));
    }

    std::string trackLayoutId;
    {
      auto res = Shared::Utils::GetSessionInfoTrackLayoutId(sessionInfo);
      if (!res) {
        return std::unexpected(GeneralError(ErrorCode::General, "session info could not determine trackLayoutId"));
      }

      trackLayoutId = res.value();
    }
    // FIND BEST LAP TIME
    // TODO: Add optional predicate command to allow
    //  User specified optimization/selection
    TelemetryFileHandler::LapDataWithPath bestLap{};
    for (auto& currentLap : laps) {
      auto& lapNum = std::get<1>(bestLap);
      auto& lapTime = std::get<2>(bestLap);
      auto& itLapTime = std::get<2>(currentLap);
      if (!lapNum || itLapTime < lapTime) {
        bestLap = currentLap;
      }
    }
    
    auto trajectory = std::make_shared<Models::LapTrajectory>();    
    {
      auto timestamp = TimeEpoch<std::chrono::milliseconds>().count();
      trajectory->set_timestamp(timestamp);
      
      auto& winfo = sessionInfo->weekendInfo;
      auto trackMetadata = trajectory->mutable_track_metadata();
      trackMetadata->set_id(winfo.trackID);
      trackMetadata->set_name(winfo.trackName);
      trackMetadata->set_layout_name(winfo.trackConfigName);      
      trackMetadata->set_layout_id(trackLayoutId);
    }

    auto lapMeta = trajectory->mutable_metadata();
    // auto lapPath = trajectory->mutable_path();

    lapMeta->set_lap(std::get<1>(bestLap));
    lapMeta->set_incident_count(std::get<3>(bestLap));
    lapMeta->set_lap_time(std::floor(std::get<2>(bestLap) * 1000.0));
    lapMeta->set_valid(std::get<3>(bestLap) == 0);

    // Get the coords from the lap data tuple
    auto& coords = std::get<4>(bestLap);    
    for (auto& coord : coords) {
      auto lat = std::get<4>(coord);
      auto lon = std::get<5>(coord);
      if (lat == 0.0 || lon == 0.0)
        continue;
      
      auto point = trajectory->add_path();
      point->set_lap_time(std::floor<int32_t>(std::get<1>(coord) * 1000.0));
      point->set_lap_percent_complete(std::get<2>(coord));
      point->set_lap_distance(std::get<3>(coord));
      point->set_latitude(std::get<4>(coord));
      point->set_longitude(std::get<5>(coord));
      point->set_altitude(std::get<6>(coord));
    }

    if (trajectory->path_size() == 0)
      return std::unexpected(GeneralError(ErrorCode::General, "no valid path points found"));

    if (options.outputDir) {
      // TODO: Specify output directory in TelemetryDataService
      // auto& outputFile = options.outputFile.value();
      // WriteTextFile(outputFile, trajectory->SerializeAsString());
    }
    
    return trajectory;
  }


}// namespace IRacingTools::Shared::Services
