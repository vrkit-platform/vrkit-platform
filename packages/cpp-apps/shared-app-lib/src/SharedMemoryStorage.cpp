//
// Created by jglanz on 1/5/2024.
//


#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>

namespace IRacingTools::Shared {
std::shared_ptr<SharedMemoryStorage> SharedMemoryStorage::GetInstance() {
    static std::shared_ptr<SharedMemoryStorage> gInstance;
    if (!gInstance) {
        gInstance.reset(new SharedMemoryStorage());
    }

    return gInstance;
}

bool SharedMemoryStorage::loadTrackMapFromLapTrajectoryFile(const fs::path &path) {
    auto ltResult = IRacingTools::Shared::ReadMessageFromFile<LapTrajectory>(path);
    if (!ltResult)
        return false;
    auto& lt = ltResult.value();
    auto trackMap = Geometry::ToTrackMap(lt);
    setTrackMap(trackMap);
    return true;
}

std::optional<TrackMap> SharedMemoryStorage::setTrackMap(const std::optional<TrackMap> &newTrackMap) {
    auto oldTrackMap = trackMap_;
    trackMap_ = newTrackMap;
    return oldTrackMap;
}

std::optional<TrackMap> SharedMemoryStorage::trackMap() {
    return trackMap_;
}

SharedMemoryStorage::SharedMemoryStorage() {}
} // namespace IRacingTools::Shared
