#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

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

  class TelemetryDataService : public std::enable_shared_from_this<TelemetryDataService>, public Service {

  public:
    /**
     * @brief Options to customize the service.
     */
    struct Options {
      std::optional<fs::path> dataFile{std::nullopt};
      std::vector<fs::path> ibtPaths{};
    };

    TelemetryDataService();

    explicit TelemetryDataService(const Options &options);

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
    virtual std::optional<SDK::GeneralError> destroy() override;

    std::vector<fs::path> listAvailableIBTFiles();

    void setOptions(const Options &options);

    void reset(bool skipPrepare = false);

  private:
    Options options_{};
    std::unique_ptr<Utils::JSONLinesMessageFileHandler<TelemetryDataFile>> dataFileHandler_{nullptr};
    std::vector<fs::path> filePaths_{};
    std::vector<std::unique_ptr<FileSystem::FileWatcher>> fileWatchers_{};
    
    std::map<std::string, std::shared_ptr<TelemetryDataFile>> dataFiles_{};
  };
}// namespace IRacingTools::Shared::Services
