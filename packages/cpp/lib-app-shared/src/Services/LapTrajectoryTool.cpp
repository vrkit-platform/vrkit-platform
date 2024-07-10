
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

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
    // static constexpr std::string_view LogCategory = PrettyType<LapTrajectoryTool>();
    static Logger L{GetCategoryWithType<LapTrajectoryTool>()};
  }// namespace


  std::expected<Models::Telemetry::LapTrajectory, GeneralError>
  LapTrajectoryTool::createLapTrajectory(const std::filesystem::path &file, const CreateOptions& options) {
    auto client = std::make_shared<SDK::DiskClient>(file, file.string());
    return createLapTrajectory(client,options);
  }

  std::expected<Models::Telemetry::LapTrajectory, GeneralError>
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
    
    // FIND BEST LAP TIME
    // TODO: Add optional predicate command to allow
    //  User specified optimization/selection
    TelemetryFileHandler::LapDataWithPath lap{};
    for (auto& it : laps) {
      auto& lapNum = std::get<1>(lap);
      auto& lapTime = std::get<2>(lap);
      auto& itLapTime = std::get<2>(it);
      if (!lapNum || itLapTime < lapTime) {
        lap = it;
      }
    }


    Models::Telemetry::LapTrajectory trajectory;
    auto lapMeta = trajectory.mutable_metadata();
    auto lapPath = trajectory.mutable_path();

    lapMeta->set_lap(std::get<1>(lap));
    lapMeta->set_incident_count(std::get<3>(lap));
    lapMeta->set_lap_time(std::floor(std::get<2>(lap) * 1000.0));
    lapMeta->set_valid(std::get<3>(lap) == 0);

    // Get the coords from the lap data tuple
    auto& coords = std::get<4>(lap);    
    for (auto& coord : coords) {
      auto point = trajectory.add_path();
      point->set_lap_time(std::floor<int32_t>(std::get<0>(coord) * 1000.0));
      point->set_lap_percent_complete(std::get<1>(coord));
      point->set_lap_distance(std::get<2>(coord));
      point->set_latitude(std::get<3>(coord));
      point->set_longitude(std::get<4>(coord));
      point->set_altitude(std::get<5>(coord));
    }

    if (options.outputDir) {
      
      // auto& outputFile = options.outputFile.value();
      // WriteTextFile(outputFile, trajectory.SerializeAsString());
    }
    
    return trajectory;
  }


}// namespace IRacingTools::Shared::Services
