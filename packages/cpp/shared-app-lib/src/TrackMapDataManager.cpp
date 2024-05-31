#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/TrackMapDataManager.h>

namespace IRacingTools::Shared {
    TrackMapDataManager::TrackMapDataManager(token) : dataPath_(GetAppDataPath() / TrackDataPath), filePaths_(
        {GetUserDataPath(TracksPath), GetAppDataPath(TracksPath)}
    ) {}

    std::optional<SDK::GeneralError> TrackMapDataManager::load() {
        return std::nullopt;
    }

    std::optional<SDK::GeneralError> TrackMapDataManager::save() {
        return std::nullopt;
    }

    bool TrackMapDataManager::exists(const std::string& nameOrAlias) {
        return false;
    }

    bool TrackMapDataManager::isAvailable(const std::string& nameOrAlias) {
        return false;
    }

    const Models::UI::Config::TrackMapDataFile* TrackMapDataManager::get(const std::string& nameOrAlias) {
        return nullptr;
    }

    std::expected<const Models::UI::Config::TrackMapDataFile*, SDK::GeneralError> TrackMapDataManager::upsert(
        const TrackMapDataFile& newConfig
    ) {
        return std::unexpected(SDK::GeneralError(SDK::ErrorCode::NotFound, "not implemented yet"));
    }
} // namespace IRacingTools::Shared::Geometry
