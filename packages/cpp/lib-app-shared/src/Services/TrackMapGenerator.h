#pragma once

#include <chrono>

#include <VRKit/Shared/Services/TelemetryDataService.h>
#include <VRKit/Shared/Services/TrackMapService.h>


namespace VRKit::Shared::Services {

  using GenerateResult =
      std::expected<std::shared_ptr<TrackMapFile>, GeneralError>;

  GenerateResult GenerateTrackMap(
      const std::shared_ptr<ServiceContainer> &serviceContainer,
      std::shared_ptr<TelemetryDataFile> dataFile);


  std::string TrackLayoutIdToFilename(const std::string &trackLayoutId);

}