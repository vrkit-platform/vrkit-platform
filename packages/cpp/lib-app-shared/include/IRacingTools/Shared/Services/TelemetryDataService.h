#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/TelemetryDataFile.pb.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>


namespace IRacingTools::Shared::Services {

  using namespace Models;
  using namespace Common;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class TelemetryDataService : public std::enable_shared_from_this<TelemetryDataService>, public Service {

  public:
    using TaskQueueType =
        TaskQueue<std::shared_ptr<TelemetryDataFile>, fs::path, std::shared_ptr<TelemetryDataFile>>;
    using TQFutureType = TaskQueueType::FutureType;
    using TQReturnType = TaskQueueType::ReturnType;
    using TQArgsType = TaskQueueType::ArgsType;
    using TQFnType = TaskQueueType::FnType;

    using TQPendingFileMap = std::map<std::string, TQFutureType>;

    using DataFileMap = std::map<std::string, std::shared_ptr<TelemetryDataFile>>;

    /**
     * @brief Options to customize the service.
     */
    struct Options {
      std::optional<fs::path> jsonlFile{std::nullopt};
      std::vector<fs::path> ibtPaths{};
    };

    TelemetryDataService() = delete;

    virtual ~TelemetryDataService();
    /**
     * @brief Simple constructor
     */
    explicit TelemetryDataService(const std::shared_ptr<ServiceContainer>& serviceContainer);

    /**
     * @brief Constructor with Options
     */
    explicit TelemetryDataService(const std::shared_ptr<ServiceContainer>& serviceContainer, const Options &options);

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
     * @brief Get an instance by filename if available
     * 
     * @param file 
     * @return std::shared_ptr<TelemetryDataFile> 
     */
    std::shared_ptr<TelemetryDataFile> getByFile(const fs::path &file);

    /**
     * @brief
     *
     * @param dataFile
     * @param skipFileChangedEvent
     * @return
     */
    std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
    set(const std::shared_ptr<TelemetryDataFile> &dataFile, bool skipFileChangedEvent = false);

    std::expected<const std::vector<std::shared_ptr<TelemetryDataFile>>, SDK::GeneralError>
    set(const std::vector<std::shared_ptr<TelemetryDataFile>> &changedDataFiles, bool skipFileChangedEvent = false);

    std::optional<SDK::GeneralError> load(bool reload = false);
    std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> save();

    std::optional<fs::path> findFile(const std::shared_ptr<TelemetryDataFile> &dataFile);

    std::vector<std::shared_ptr<TelemetryDataFile>> toList();


    std::size_t size();

    /**
     * @brief Initialize the service
     */
    virtual std::expected<bool, SDK::GeneralError> init() override;

    /**
     * @brief Must set running == true in overridden implementation
     */
    virtual std::expected<bool, SDK::GeneralError> start() override;

    /**
     * @brief Must set running == false in overridden implementation
     */
    virtual std::optional<SDK::GeneralError> destroy() override;

    std::vector<fs::path> listTelemetryFiles(const std::optional<std::vector<std::filesystem::path>>& overrideFilePaths);

    void setOptions(const Options &options);

    void reset(bool skipPrepare = false);

    std::optional<SDK::GeneralError> clearTelemetryFileCache();

    bool hasPendingTasks();
    std::size_t pendingTaskCount();

    std::size_t scanAllFiles(const std::optional<std::vector<std::filesystem::path>>& overrideFilePaths);

    std::expected<std::shared_ptr<TrackLayoutMetadata>, GeneralError> getTrackLayoutMetadata(const std::shared_ptr<TelemetryDataFile>& dataFile);
    std::expected<std::shared_ptr<TrackLayoutMetadata>, GeneralError> getTrackLayoutMetadata(const fs::path& file);

    struct {
      EventEmitter<TelemetryDataService*, const std::vector<std::shared_ptr<TelemetryDataFile>>&> onFilesChanged{};
    } events;

  private:
    std::size_t enqueueFiles(const std::vector<fs::path>& files);
    TQReturnType taskQueueFn(fs::path file,std::shared_ptr<TelemetryDataFile> dataFile);

    Options options_{};
    std::unique_ptr<JSONLinesMessageFileHandler<TelemetryDataFile>> dataFileHandler_{nullptr};
    std::vector<fs::path> filePaths_{};
    std::vector<std::unique_ptr<FileSystem::FileWatcher>> fileWatchers_{};
    DataFileMap dataFiles_{};

    std::unique_ptr<TaskQueueType> fileTaskQueue_{nullptr};
    TQPendingFileMap pendingFileMap_{};
    // std::vector<std::shared_ptr<Request>> pendingRequests_{};
  };
} // namespace IRacingTools::Shared::Services
