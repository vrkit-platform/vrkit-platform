#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>


#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared {
    class TrackMapDataManager : public SDK::Utils::Singleton<TrackMapDataManager> {
        public:
            using Models::UI::Config::TrackMapDataFile;
            TrackMapDataManager() = delete;

            std::optional<SDK::GeneralError> load();
            std::optional<SDK::GeneralError> save();

            /**
             * @brief check if `TrackMapDataFile` exists
             *
             * @param nameOrAlias of track map
             * @return whether it exists in the loaded config map
             */
            bool exists(const std::string& nameOrAlias);
            /**
             * @brief Check if `TrackMapDataFile` exists & is `.available`
             *
             * @param nameOrAlias
             * @return
             */
            bool isAvailable(const std::string& nameOrAlias);

            /**
             * @brief Get existing config by name or alias
             *
             * @param nameOrAlias
             * @return
             */
            const TrackMapDataFile* get(const std::string& nameOrAlias);

            /**
             * @brief
             *
             * @param newConfig
             * @return
             */
            std::expected<const TrackMapDataFile*,SDK::GeneralError> upsert(const TrackMapDataFile& newConfig);

        private:
            explicit TrackMapDataManager(token);
            friend Singleton;

            std::mutex persistMutex_{};
            fs::path dataPath_;
            std::vector<fs::path> filePaths_;
            std::multimap<std::string, TrackMapDataFile> configs_{};
    };
} // namespace IRacingTools::Shared::Geometry
