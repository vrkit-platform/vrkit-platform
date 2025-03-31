#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <filesystem>

#include <IRacingTools/Models/LapTrajectory.pb.h>

#include <IRacingSDK/DiskClient.h>
#include <IRacingSDK/DiskClientDataFrameProcessor.h>
#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <IRacingSDK/VarHolder.h>

#include <IRacingTools/Shared/Services/TelemetryFileHandler.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingSDK;
  using namespace IRacingSDK::Utils;

  class LapTrajectoryTool {  
  public:    
    struct CreateOptions {
      std::optional<std::filesystem::path> outputDir {std::nullopt};
      bool includeInvalidLaps{false};
    };

    std::expected<std::shared_ptr<Models::LapTrajectory>, GeneralError> createLapTrajectory(const std::filesystem::path &file, const CreateOptions& options = {});
    std::expected<std::shared_ptr<Models::LapTrajectory>, GeneralError> createLapTrajectory(const std::shared_ptr<IRacingSDK::DiskClient> &client, const CreateOptions& options = {});

  
    
  
  };
}// namespace IRacingTools::Shared::Services
