#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <memory>

#include <VRKit/Models/rpc/Envelope.pb.h>
#include <VRKit/Models/rpc/Messages/SimpleMessages.pb.h>

#include <VRKit/Models/LapTrajectory.pb.h>
#include <VRKit/Models/TelemetryDataFile.pb.h>
#include <VRKit/Models/TrackMap.pb.h>
#include <VRKit/Models/TrackMapFile.pb.h>

#include <IRacingSDK/Utils/LUT.h>

#include <VRKit/Shared/Common/TaskQueue.h>
#include <VRKit/Shared/FileWatcher.h>
#include <VRKit/Shared/ProtoHelpers.h>


#include <VRKit/Shared/Services/Pipelines/PipelineExecutor.h>
#include <VRKit/Shared/Services/Service.h>

namespace VRKit::Shared::Services {

  using namespace VRKit::Models;
  using namespace VRKit::Shared::Common;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class TrackMapService : public std::enable_shared_from_this<TrackMapService>,
                          public Service {

  public:
    using TrackMapTaskQueue =
        TaskQueue<std::string, const std::shared_ptr<TelemetryDataFile> &>;
    using FileMap = std::map<std::string, std::shared_ptr<TrackMapFile>>;
    using DataFileMap = std::map<std::string, std::shared_ptr<LapTrajectory>>;

    struct {
      EventEmitter<std::shared_ptr<TrackMapService>> onReady{};
      EventEmitter<
          std::shared_ptr<TrackMapService>,
          std::vector<std::shared_ptr<TrackMapFile>>>
          onFilesChanged{};
    };
    /**
     * @brief Options to customize the service.
     */
    struct Options {
      std::vector<fs::path> paths{};
    };

    TrackMapService() = delete;

    virtual ~TrackMapService();
    /**
     * @brief Simple constructor
     */
    explicit
    TrackMapService(const std::shared_ptr<ServiceContainer> &serviceContainer);

    /**
     * @brief Constructor with Options
     */
    explicit TrackMapService(
        const std::shared_ptr<ServiceContainer> &serviceContainer,
        const Options &options);


    /**
     * @brief check if `LapTrajectory` exists.
     *
     * @param trackLayoutId of track map.
     * @return whether it exists in the loaded config map.
     */
    bool exists(const std::string &trackLayoutId);
    /**
     * @brief Check if `LapTrajectory` exists & is `.available`
     *
     * @param trackLayoutId
     * @return
     */
    bool isAvailable(const std::string &trackLayoutId);


    /**
     * @brief Get existing config by name or alias
     *
     * @param trackLayoutId
     * @return
     */
    std::shared_ptr<LapTrajectory> getData(const std::string &trackLayoutId);

    std::shared_ptr<TrackMapFile> get(const std::string &trackLayoutId);

    /**
     * @brief
     *
     * @param tmFile
     * @return
     */
    std::expected<const std::shared_ptr<TrackMapFile>, IRacingSDK::GeneralError>
    set(const std::shared_ptr<TrackMapFile> &tmFile);

    std::expected<const std::shared_ptr<TrackMapFile>, IRacingSDK::GeneralError>
    set(const std::string &trackLayoutId,
        const std::shared_ptr<TrackMapFile> &tmFile);

    std::optional<fs::path>
    findFile(const std::shared_ptr<LapTrajectory> &dataFile);
    std::optional<fs::path> findFile(const std::string &trackLayoutId);
    std::size_t cacheSize();

    /**
     * @brief Initialize the service
     */
    virtual std::expected<bool, IRacingSDK::GeneralError> init() override;

    /**
     * @brief Must set running == true in overridden implementation
     */
    virtual std::expected<bool, IRacingSDK::GeneralError> start() override;

    /**
     * @brief Must set running == false in overridden implementation
     */
    virtual std::optional<IRacingSDK::GeneralError> destroy() override;

   //std::expected<std::shared_ptr<RPC::Messages::ListMessage>, GeneralError> rpcList(const std::shared_ptr<Models::RPC::Messages::ListMessage>& request, const std::shared_ptr<RPC::Envelope> & envelope);

    std::vector<fs::path> listTrackMaps();

    void setOptions(const Options &options);

    void reset(bool skipPrepare = false);

    std::optional<IRacingSDK::GeneralError> clearTrackMapCache();

    fs::path getFilePath();

    std::vector<std::shared_ptr<TrackMapFile>> toFileList();

    std::expected<std::shared_ptr<TrackMapService>, IRacingSDK::GeneralError> save();

    std::optional<IRacingSDK::GeneralError> load(bool reload = false);
    bool hasPendingTasks();
    std::size_t pendingTaskCount();

    struct {
      EventEmitter<TrackMapService *> onReady{};
      EventEmitter<
          TrackMapService *,
          const std::vector<std::shared_ptr<TrackMapFile>> &>
          onFilesChanged{};
    } events;

  private:
    void enqueueDataFiles(const std::vector<std::shared_ptr<TelemetryDataFile>>
                              &changedDataFiles);

    std::string
    dataFileTaskQueueFn(const std::shared_ptr<TelemetryDataFile> &dataFile);

    Options options_{};
    std::unique_ptr<JSONLinesMessageFileHandler<TrackMapFile>> fileHandler_{
        nullptr};
    std::vector<fs::path> filePaths_{};
    DataFileMap dataFiles_{};
    FileMap files_{};
    std::unique_ptr<TrackMapTaskQueue> dataFileTaskQueue_{nullptr};
    std::map<std::string, TrackMapTaskQueue::FutureType> dataFilesTaskMap_{};
    std::condition_variable dataFilesToProcessCondition_{};

    // std::shared_ptr<std::thread> processorThread_{nullptr};
  };

} // namespace VRKit::Shared::Services
