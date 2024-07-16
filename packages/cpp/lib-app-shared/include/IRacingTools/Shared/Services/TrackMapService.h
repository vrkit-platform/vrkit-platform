#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/Pipeline.pb.h>
#include <IRacingTools/Models/TelemetryData.pb.h>
#include <IRacingTools/Models/LapData.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>

namespace IRacingTools::Shared::Services {

  using namespace Models;
  using Telemetry::LapTrajectory;
  using Telemetry::LapTrajectory;
  
  /**
   * @brief Responsible for handling telemetry data files
   */
  class TrackMapService : public std::enable_shared_from_this<TrackMapService>, public Service {

  public:
    using DataFileMap = std::map<std::string, std::shared_ptr<LapTrajectory>>;

    /**
     * @brief Options to customize the service.
     */
    struct Options {
      std::vector<fs::path> paths{};
    };

    TrackMapService() = delete;
    /**
     * @brief Simple constructor
     */
    explicit TrackMapService(const std::shared_ptr<ServiceContainer>& serviceContainer);

    /**
     * @brief Constructor with Options
     */
    explicit TrackMapService(const std::shared_ptr<ServiceContainer>& serviceContainer, const Options &options);

    /**
     * @brief check if `LapTrajectory` exists.
     *
     * @param nameOrAlias of track map.
     * @return whether it exists in the loaded config map.
     */
    bool exists(const std::string &trackLayoutId);
    /**
     * @brief Check if `LapTrajectory` exists & is `.available`
     *
     * @param nameOrAlias
     * @return
     */
    bool isAvailable(const std::string &trackLayoutId);


    /**
     * @brief Get existing config by name or alias
     *
     * @param nameOrAlias
     * @return
     */
    std::shared_ptr<LapTrajectory> get(const std::string &trackLayoutId);

    /**
     * @brief
     *
     * @param config
     * @return
     */
    std::expected<const std::shared_ptr<LapTrajectory>, SDK::GeneralError>
    set(const std::shared_ptr<LapTrajectory> &config);

    std::expected<const std::shared_ptr<LapTrajectory>, SDK::GeneralError>
    set(const std::string &id, const std::shared_ptr<LapTrajectory> &config);

    std::expected<std::shared_ptr<TrackMapService>, SDK::GeneralError> load(bool reload = false);
    std::expected<std::shared_ptr<TrackMapService>, SDK::GeneralError> save();

    std::optional<fs::path> findFile(const std::shared_ptr<LapTrajectory> &dataFile);

    std::vector<std::shared_ptr<LapTrajectory>> toDataFileList();
    DataFileMap &getDataFileMapRef();

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
    virtual std::optional<SDK::GeneralError> destroy() override;

    std::vector<fs::path> listTrackMaps();

    void setOptions(const Options &options);

    void reset(bool skipPrepare = false);

    std::optional<SDK::GeneralError> clearTrackMapCache();

  private:
    Options options_{};
    std::vector<fs::path> filePaths_{};
    DataFileMap dataFiles_{};
  };
} // namespace IRacingTools::Shared::Services
