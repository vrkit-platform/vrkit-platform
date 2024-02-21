//
// Created by jglanz on 1/5/2024.
//

#pragma once
#include <optional>
#include <shared_mutex>
#include <IRacingTools/Models/TrackMapData.pb.h>

#include "FileSystemHelpers.h"

namespace IRacingTools::Shared {

class SharedMemoryStorage {
public:
    static std::shared_ptr<SharedMemoryStorage> GetInstance();

    bool loadTrackMapFromLapTrajectoryFile(const fs::path& path);
    std::optional<TrackMap> setTrackMap(const std::optional<TrackMap> &newTrackMap);
    std::optional<TrackMap> trackMap();


private:
    SharedMemoryStorage();

    std::shared_mutex mutex_{};
    std::optional<TrackMap> trackMap_{std::nullopt};
};

} // namespace IRacingTools::Apps::Shared
