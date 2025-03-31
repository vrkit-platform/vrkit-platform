#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/Pipeline.pb.h>
#include <IRacingTools/Models/TelemetryDataFile.pb.h>

#include <IRacingSDK/Utils/CollectionHelpers.h>
#include <IRacingSDK/Utils/RunnableThread.h>
#include <IRacingSDK/Utils/LUT.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Service.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

namespace IRacingTools::Shared::Services {

  using namespace Models;

  using ProcessResult =
      std::expected<std::shared_ptr<TelemetryDataFile>, GeneralError>;

  ProcessResult ProcessTelemetryDataFile(
    const std::shared_ptr<TelemetryDataService> & service, const fs::path& file, std::shared_ptr<TelemetryDataFile> dataFile);

} // namespace IRacingTools::Shared::Services
