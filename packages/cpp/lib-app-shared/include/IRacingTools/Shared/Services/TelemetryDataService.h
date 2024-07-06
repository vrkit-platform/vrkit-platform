#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/Pipeline.pb.h>
#include <IRacingTools/Models/TelemetryData.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>
#include <IRacingTools/Shared/Services/TrackMapPipelineExecutor.h>


namespace IRacingTools::Shared::Services {

  using Models::Telemetry::TelemetryDataFile;
  using namespace Models;

  class TelemetryDataService : public std::enable_shared_from_this<TelemetryDataService>, public Services::Service {

  public:
    /**
     * @brief Options to customize the service.
     */
    struct Options {
      std::optional<fs::path> dataFile{std::nullopt};
      std::vector<fs::path> ibtPaths{};
    };

    TelemetryDataService() = delete;

    /**
     * @brief check if `TelemetryDataFile` exists.
     *
     * @param nameOrAlias of track map.
     * @return whether it exists in the loaded config map.
     */
    bool exists(const std::string &nameOrAlias);
    /**
     * @brief Check if `TelemetryDataFile` exists & is `.available`
     *
     * @param nameOrAlias
     * @return
     */
    bool isAvailable(const std::string &nameOrAlias);

    /**
     * @brief Get existing config by name or alias
     *
     * @param nameOrAlias
     * @return
     */
    std::shared_ptr<TelemetryDataFile> get(const std::string &nameOrAlias);

    /**
     * @brief
     *
     * @param config
     * @return
     */
    std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
    set(const std::shared_ptr<TelemetryDataFile> &config);

    std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
    set(const std::string &id, const std::shared_ptr<TelemetryDataFile> &config);

    std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> load(bool reload = false);
    std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> save();

    std::optional<fs::path> findFile(const std::shared_ptr<TelemetryDataFile> &dataFile);

    std::vector<std::shared_ptr<TelemetryDataFile>> toDataFileList();
    std::size_t size();

    /**
             * @brief Initialize the service
             */
    virtual std::expected<bool, SDK::GeneralError> init() override;

    /**
     * @brief Must set running == true in overriden implementation
     */
    virtual std::expected<bool, SDK::GeneralError> start() override;

    /**
             * @brief Must set running == false in overriden implementation
             */
    virtual void stop() override;

    virtual void destroy() override;

    std::vector<fs::path> listAvailableIBTFiles();

    explicit TelemetryDataService(const Options &options = Options{});

  private:
    Utils::JSONLinesMessageFileHandler<TelemetryDataFile> dataFileHandler_;
    std::vector<fs::path> filePaths_;
    std::vector<std::unique_ptr<FileSystem::FileWatcher>> fileWatchers_{};
    std::recursive_mutex persistMutex_{};
    std::map<std::string, std::shared_ptr<TelemetryDataFile>> dataFiles_{};
  };
}// namespace IRacingTools::Shared::Services
