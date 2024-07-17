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
    struct CreateOptions {
      std::optional<std::filesystem::path> outputDir {std::nullopt};
      bool includeInvalidLaps{false};
    };

    std::expected<std::shared_ptr<Models::Telemetry::LapTrajectory>, GeneralError> createLapTrajectory(const std::filesystem::path &file, const CreateOptions& options = {});
    std::expected<std::shared_ptr<Models::Telemetry::LapTrajectory>, GeneralError> createLapTrajectory(const std::shared_ptr<SDK::DiskClient> &client, const CreateOptions& options = {});

  
    
  
  };
}// namespace IRacingTools::Shared::Services
