#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/TrackMapFile.pb.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::App::Services {
    
    using Models::UI::Config::TrackMapFile;
    class TrackMapDataService : public SDK::Utils::Singleton<TrackMapDataService> {
        public:            

            TrackMapDataService() = delete;

            /**
             * @brief check if `TrackMapFile` exists
             *
             * @param nameOrAlias of track map
             * @return whether it exists in the loaded config map
             */
            bool exists(const std::string& nameOrAlias);
            /**
             * @brief Check if `TrackMapFile` exists & is `.available`
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
            const TrackMapFile* get(const std::string& nameOrAlias);

            /**
             * @brief
             *
             * @param newConfig
             * @return
             */
            std::expected<const TrackMapFile*,SDK::GeneralError> set(const TrackMapFile& config);

            std::expected<const TrackMapFile*,SDK::GeneralError> set(const std::string& id, const TrackMapFile& config);

            std::expected<TrackMapDataService *, SDK::GeneralError> save();

            std::optional<fs::path> findFile(const TrackMapFile& dataFile);

            std::vector<TrackMapFile> toDataFileList();

        private:
            explicit TrackMapDataService(token);
            friend Singleton;

            Utils::JSONLinesMessageFileHandler<TrackMapFile> dataFileHandler_;
            std::vector<fs::path> filePaths_;
            
            std::mutex persistMutex_{};            
            std::map<std::string, TrackMapFile> dataFiles_{};
    };
} // namespace IRacingTools::Shared::Geometry
