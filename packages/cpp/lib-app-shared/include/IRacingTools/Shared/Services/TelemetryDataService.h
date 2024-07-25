#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/Pipeline.pb.h>
#include <IRacingTools/Models/TelemetryDataFile.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>

namespace IRacingTools::Shared::Services {

  using namespace Models;
  
  class TelemetryDataFileProcessor;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class TelemetryDataService : public std::enable_shared_from_this<TelemetryDataService>, public Service {

  public:
    struct Result {
        using ProcessedType = std::pair<fs::path, std::shared_ptr<TelemetryDataFile>>;
        using FailedType = std::pair<fs::path, SDK::GeneralError>;
        using Promise = std::promise<std::shared_ptr<Result>>;
        using Future = std::future<std::shared_ptr<Result>>;
        using SharedFuture = std::shared_future<std::shared_ptr<Result>>;
        enum class Status {
          Created,
          Processing,
          Complete,
          Failed
        };

        Status status{Status::Created};
        std::optional<SDK::GeneralError> error{std::nullopt};
        std::deque<fs::path> unprocessedFiles{};
        std::vector<ProcessedType> processedFiles{};
        std::vector<FailedType> failedFiles{};
      };
      struct Request {
        std::size_t id;
        // TODO: Add future support for sync
        std::chrono::time_point<std::chrono::high_resolution_clock> timestamp;
        std::vector<fs::path> files;
        Result::Promise promise;
        Result::Future future;

        std::shared_ptr<Result> result{nullptr};
      };

    using DataFileMap = std::map<std::string, std::shared_ptr<TelemetryDataFile>>;

    /**
     * @brief Options to customize the service.
     */
    struct Options {
      std::optional<fs::path> jsonlFile{std::nullopt};
      std::vector<fs::path> ibtPaths{};
    };

    TelemetryDataService() = delete;

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

    std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> load(bool reload = false);
    std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> save();

    std::optional<fs::path> findFile(const std::shared_ptr<TelemetryDataFile> &dataFile);

    std::vector<std::shared_ptr<TelemetryDataFile>> toList();


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

    std::vector<fs::path> listTelemetryFiles();

    void setOptions(const Options &options);

    void reset(bool skipPrepare = false);

    std::optional<SDK::GeneralError> clearTelemetryFileCache();

    bool isProcessing();

    std::expected<std::shared_ptr<TrackLayoutMetadata>, GeneralError> getTrackLayoutMetadata(const std::shared_ptr<TelemetryDataFile>& dataFile);
    std::expected<std::shared_ptr<TrackLayoutMetadata>, GeneralError> getTrackLayoutMetadata(const fs::path& file);

    struct {
      EventEmitter<TelemetryDataService*> onReady{};
      EventEmitter<TelemetryDataService*, std::shared_ptr<Result>, std::shared_ptr<Request>> onRequestComplete{};
      EventEmitter<TelemetryDataService*, const std::vector<std::shared_ptr<TelemetryDataFile>>&> onFilesChanged{};
    } events;

  private:
    Options options_{};
    std::unique_ptr<JSONLinesMessageFileHandler<TelemetryDataFile>> dataFileHandler_{nullptr};
    std::vector<fs::path> filePaths_{};
    std::vector<std::unique_ptr<FileSystem::FileWatcher>> fileWatchers_{};
    std::shared_ptr<TelemetryDataFileProcessor> processorThread_{nullptr};
    DataFileMap dataFiles_{};
    // std::vector<std::shared_ptr<Request>> pendingRequests_{};
  };
} // namespace IRacingTools::Shared::Services
