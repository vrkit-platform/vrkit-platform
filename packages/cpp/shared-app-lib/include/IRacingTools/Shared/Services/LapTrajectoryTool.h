#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <filesystem>

#include <IRacingTools/Models/LapData.pb.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/SDK/VarHolder.h>

#include <IRacingTools/Shared/Services/TelemetryFileHandler.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;

  
  class LapTrajectoryTool {
  
  public:    
    std::expected<Models::Telemetry::LapTrajectory, GeneralError> createLapTrajectory(const std::filesystem::path &file, bool includeInvalidLaps = false);
    std::expected<Models::Telemetry::LapTrajectory, GeneralError> createLapTrajectory(const std::shared_ptr<SDK::DiskClient> &client, bool includeInvalidLaps = false);

  
    
  
  };
}// namespace IRacingTools::Shared::Services
