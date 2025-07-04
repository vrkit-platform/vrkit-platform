#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <memory>

#include <VRKit/Models/Pipeline.pb.h>
#include <VRKit/Models/TelemetryDataFile.pb.h>

#include <IRacingSDK/Utils/CollectionHelpers.h>
#include <IRacingSDK/Utils/RunnableThread.h>
#include <IRacingSDK/Utils/LUT.h>

#include <VRKit/Shared/FileWatcher.h>
#include <VRKit/Shared/ProtoHelpers.h>
#include <VRKit/Shared/Services/Service.h>
#include <VRKit/Shared/Services/TelemetryDataService.h>

namespace VRKit::Shared::Services {

  using namespace Models;

  using ProcessResult =
      std::expected<std::shared_ptr<TelemetryDataFile>, GeneralError>;

  ProcessResult ProcessTelemetryDataFile(
    const std::shared_ptr<TelemetryDataService> & service, const fs::path& file, std::shared_ptr<TelemetryDataFile> dataFile);

} // namespace VRKit::Shared::Services
