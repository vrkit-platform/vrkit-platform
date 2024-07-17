
#include <chrono>
#include <deque>
#include <fstream>
#include <iostream>
#include <magic_enum.hpp>

#include <google/protobuf/util/json_util.h>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/RunnableThread.h>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>


namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  namespace {
    auto L = GetCategoryWithType<TelemetryDataService>();
    std::mutex gProcessorMutex{};
    std::atomic_size_t gRequestIdSeq{0};

    auto CreateTelemetryDataFile(TelemetryDataService *service, const fs::path &file) {
      auto fileEncoded = Base64::encode(file.string());
      auto timestamp = TimeEpoch<std::chrono::milliseconds>().count();
      auto dataFile = std::make_shared<TelemetryDataFile>();

      dataFile->set_id(fileEncoded);
      dataFile->set_alias(file.filename().string());
      dataFile->set_filename(file.string());

      dataFile->set_created_at(timestamp);
      dataFile->set_updated_at(timestamp);
      dataFile->set_status(TelemetryDataFile::STATUS_CREATED);
      
      service->set(dataFile);

      return dataFile;
    }
    
    /**
     * @brief Hold result info for a pipeline
     */
    struct ExecutePipelineResult {
      fs::path file;
      std::string dataFileId;
      PipelineType type;
      PipelineStatus status;
      
      std::string pipelineId{""};
      std::string attemptId{""};
      std::optional<SDK::GeneralError> error{std::nullopt};

      /**
       * @brief Set the result error info
       * 
       * @tparam Args 
       * @param fmt 
       * @param args 
       * @return auto 
       */
      template <typename... Args>
      auto setError(fmt::format_string<Args...> fmt, Args&&... args) {
        auto msg = fmt::format(fmt, std::forward<Args>(args)...);
        error = SDK::GeneralError(ErrorCode::General, msg);
        status = PipelineStatus::PIPELINE_STATUS_ERROR;
        return this;
      }
    };

    template<PipelineType Type>
    ExecutePipelineResult ExecutePipeline(TelemetryDataService *service, const std::shared_ptr<TelemetryDataFile> &dataFile,
                         const fs::path &file) {
      Models::Pipeline *pipeline{nullptr};
      Models::Pipeline::Attempt *attempt{nullptr};

      ExecutePipelineResult result {
        .file = file,
        .dataFileId = dataFile->id(),
        .type = Type,
        .status = PipelineStatus::PIPELINE_STATUS_CREATED
      };

      auto persistDataFile = [&] () {
        if (auto res = service->save(); !res) {
          L->warn("Failed to save data file ({}), error: {}", dataFile->filename(), res.error().what());
        } else {
          L->debug("Save data file ({})", dataFile->filename());
        }
      };

      {
        std::string id{magic_enum::enum_name<Type>().data()};
        // FIND PIPELINE IF ALREADY EXISTS
        auto pipelinesCount = dataFile->pipelines_size();
        for (std::size_t i = 0; i < pipelinesCount; i++) {
          // for (auto it: dataFile->mutable_pipelines()) {
          auto it = dataFile->mutable_pipelines(i);
          if (it->type() == Type) {
            pipeline = it;
            break;
          }
        }

        // IF NO EXISTING PIPELINE WAS FOUND, CREATE ONE
        if (!pipeline) {
          pipeline = dataFile->add_pipelines();
          pipeline->set_id(id);
          pipeline->set_type(Type);
          pipeline->set_status(PipelineStatus::PIPELINE_STATUS_PROCESSING);
        }

        // CREATE A NEW ATTEMPT INSTANCE
        auto attemptCount = pipeline->attempts_size();
        auto attemptNumber = attemptCount + 1;

        attempt = pipeline->add_attempts();
        auto attemptMillis = TimeEpoch().count();
        auto attemptId = std::format("{}_{}", id, attemptMillis);
        attempt->set_id(attemptId);
        attempt->set_timestamp(attemptMillis);
        attempt->set_attempt_number(attemptNumber);
        attempt->set_status(Models::PipelineStatus::PIPELINE_STATUS_CREATED);
      }

      
      auto executor = PipelineExecutorRegistry<Type, std::shared_ptr<TelemetryDataFile>>::GetPtr()->build();
      if (!executor) {
        // result.setError("Executor not found for type ({})", Type);
        result.setError("Executor not found for type ({})", magic_enum::enum_name(Type).data());
        return result;
      }

      PipelineExecutor<std::shared_ptr<TelemetryDataFile>>::PipelineAttemptEditor attemptEditor(pipeline, attempt);
      auto res = executor->execute(attemptEditor, service->getContainer(), dataFile);
      if (res) {
        auto error = res.value();
        result.setError("Failed to execute pipeline: {}", error.what());        
        return result;
      }

      result.status = PIPELINE_STATUS_COMPLETE;
      return result;
    }
    
    std::expected<std::vector<ExecutePipelineResult>, SDK::GeneralError> ExecutePipelines(TelemetryDataService *service, const std::shared_ptr<TelemetryDataFile> &dataFile,
                          const fs::path &file) {
      
      std::vector<ExecutePipelineResult> results{};
      results.push_back(ExecutePipeline<PIPELINE_TYPE_TRACK_MAP>(service, dataFile, file));
      return results;
    }
  }

    class TelemetryDataFileProcessorInternal : public RunnableThread {
    public:
      using Request = TelemetryDataService::Request;
      using Result = TelemetryDataService::Result;
    private:
      TelemetryDataService *service_;
      std::mutex requestMutex_{};
      std::condition_variable requestCondition_{};
      std::deque<std::shared_ptr<Request>> requests_{};

    public:
      TelemetryDataFileProcessorInternal(TelemetryDataService *service) : service_(service){};
      

      /**
       * @brief Submit a new request
       *
       * @param files
       * @return std::shared_ptr<Request>
       */
      std::shared_ptr<Request> submitRequest(const std::vector<fs::path> &files = {}) {
        bool notify = false;
        std::shared_ptr<Request> request{nullptr};

        {
          std::scoped_lock lock(requestMutex_);
          if (requests_.empty()) {
            Result::Promise promise{};
            auto future = promise.get_future();
            request = requests_.emplace_back(new Request{.id = gRequestIdSeq++,
                                                         .timestamp = std::chrono::high_resolution_clock::now(),
                                                         .files = files,
                                                         .promise = std::move(promise),
                                                         .future = std::move(future)});
            notify = true;
          } else {
            request = requests_.back();
          }
        }
        if (notify)
          requestCondition_.notify_all();

        return request;
      }

      virtual void runnable() override {
        std::unique_lock<std::mutex> singletonLock(gProcessorMutex, std::defer_lock);
        assert((singletonLock.try_lock() && "Unable to acquire singleton processing lock"));

        while (isRunning()) {
          std::shared_ptr<Request> request{nullptr};
          {
            std::unique_lock lock(requestMutex_);
            if (requests_.empty()) {
              requestCondition_.wait(lock, [&] {
                return !isRunning() || !requests_.empty();
              });
            } else {
              request = requests_.front();
              requests_.pop_front();
            }
          }

          if (!request)
            continue;

          L->info("Processing request (id={})", request->id);
          auto &result = request->result = std::make_shared<Result>();
          result->status = Result::Status::Processing;

          auto requestedFiles = request->files.empty() ? service_->listTelemetryFiles() : request->files;
          auto &unprocessedFiles = result->unprocessedFiles =
              std::deque<fs::path>(requestedFiles.begin(), requestedFiles.end());
          auto &processedFiles = result->processedFiles;
          auto &failedFiles = result->failedFiles;

          while (!unprocessedFiles.empty()) {
            auto file = unprocessedFiles.front();
            unprocessedFiles.pop_front();

            auto dataFile = service_->getByFile(file);
            if (dataFile && dataFile->status() != TelemetryDataFile::STATUS_CREATED && dataFile->status() != TelemetryDataFile::STATUS_ERROR) {
              L->debug("Ignoring telemetry file ({}) as it has already been ingested");
              processedFiles.emplace_back(Result::ProcessedType{file, dataFile});              
              continue;
            }

            if (!dataFile)
              dataFile = CreateTelemetryDataFile(service_, file);
            
            if (ExecutePipelines(service_, dataFile, file)) {
              processedFiles.emplace_back(Result::ProcessedType{file, dataFile});
              dataFile->set_status(TelemetryDataFile::STATUS_AVAILABLE);
            } else {
              failedFiles.emplace_back(Result::FailedType{
                  file, SDK::GeneralError(ErrorCode::General, "Unknown error occurred while processing file")});
              L->error("Pipelines failed to process, skipping {} & subsequent files", file.string());
              dataFile->set_status(TelemetryDataFile::STATUS_INVALID);
            }

            service_->set(dataFile);
            
            
          }

          result->status = Result::Status::Complete;
          
          L->info("Processed request (id={},status={})", request->id, magic_enum::enum_name(result->status).data());

          request->promise.set_value(result);
        }
      };
    };

  TelemetryDataService::TelemetryDataService(const std::shared_ptr<ServiceContainer> &serviceContainer)
      : TelemetryDataService(serviceContainer, Options{}) {
  }

  TelemetryDataService::TelemetryDataService(const std::shared_ptr<ServiceContainer> &serviceContainer,
                                             const Options &options)
      : Service(serviceContainer, PrettyType<TelemetryDataService>{}.name()), options_(options) {
    reset();
  }

  void TelemetryDataService::reset(bool skipPrepare) {
    auto onReadHandler =
        [&](std::vector<std::shared_ptr<IRacingTools::Models::Telemetry::TelemetryDataFile>> &dataFiles) {
          std::scoped_lock lock(stateMutex_);
          dataFiles_.clear();
          for (auto &dataFile: dataFiles) {
            dataFiles_[dataFile->id()] = dataFile;
          }
        };
    {
      std::scoped_lock lock(stateMutex_);
      
      // CLEANUP FIRST
      if (dataFileHandler_) {
        dataFileHandler_.release();
      }

      if (processorThread_) {
        processorThread_->stop();
      }

      for (auto &watcher: fileWatchers_) {
        watcher->stop();
      }

      filePaths_.clear();

      // NOW PREPARE
      if (!skipPrepare) {
        processorThread_ = std::make_shared<TelemetryDataFileProcessorInternal>(this);
        dataFileHandler_ = std::make_unique<Utils::JSONLinesMessageFileHandler<TelemetryDataFile>>(
            options_.dataFile.value_or(GetAppDataPath() / TrackDataPath));

        filePaths_ = options_.ibtPaths.empty() ? std::vector<fs::path>{GetIRacingTelemetryPath()} : options_.ibtPaths;

        dataFileHandler_->events.onRead.subscribe(onReadHandler);
      }
    }
  }

  void TelemetryDataService::setOptions(const Options &options) {
    std::scoped_lock lock(stateMutex_);
    options_ = options;
    reset();
  }

  std::expected<bool, SDK::GeneralError> TelemetryDataService::init() {
    std::scoped_lock lock(stateMutex_);

    // READ THE UNDERLYING DATA FILE, THE RESULT (IF SUCCESSFUL) IS HANDLED BY
    // THE `onRead` EVENT HANDLER
    L->info("Reading telemetry data jsonl file: {}", dataFileHandler_->file().string());
    auto res = dataFileHandler_->read();

    // IF THERE WAS AN ERROR, THEN RETURN HERE
    if (!res && res.error().code() != SDK::ErrorCode::NotFound) {
      return std::unexpected(res.error());
    }

    // CREATE FILE WATCHERS
    for (auto &path: filePaths_) {
      L->info("Creating watcher @ {}", path.string());
      fileWatchers_.push_back(std::make_unique<FileSystem::FileWatcher>(
          path.wstring(), [&](const FileSystem::FileWatcher::WatchEventData &file, FileSystem::WatchEvent eventType) {
            std::scoped_lock lock(stateMutex_);
            L->info("EVENT({}) FILE({}) PATH({})", std::string(magic_enum::enum_name(eventType).data()),
                    file.path.string(), path.string());
            if (eventType == FileSystem::WatchEvent::Removed) {
              return;
            }
          }));
    }

    return true;
  }

  std::expected<bool, SDK::GeneralError> TelemetryDataService::start() {
    std::scoped_lock lock(stateMutex_);

    if (state() >= State::Starting)
      return state() == State::Running;

    setState(State::Starting);

    // START THE PROCESSOR
    processorThread_->start();

    // START ALL FILE WATCHERS
    for (auto &watcher: fileWatchers_) {
      watcher->start();
    }

    setState(State::Running);


    return true;
  }

  std::optional<SDK::GeneralError> TelemetryDataService::destroy() {
    std::scoped_lock lock(stateMutex_);
    if (state() >= State::Destroying)
      return std::nullopt;

    setState(State::Destroying);
    reset(true);
    setState(State::Destroyed);
    return std::nullopt;
  }

  /**
   * @brief Remove underlying data file & clear the map
   *
   * @return std::optional<SDK::GeneralError>
   */
  std::optional<SDK::GeneralError> TelemetryDataService::clearTelemetryFileCache() {
    auto res = dataFileHandler_->clear();
    if (res) {
      L->error("Unable to remove underlying data file: {}", res.value().what());
      return res;
    }

    return std::nullopt;
  }

  std::vector<fs::path> TelemetryDataService::listTelemetryFiles() {
    return ListAllFilesRecursively(filePaths_);
  }
  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> TelemetryDataService::load(bool reload) {
    auto res = dataFileHandler_->read();
    if (!res) {
      return std::unexpected(res.error());
    }

    return shared_from_this();
  }

  std::expected<std::shared_ptr<TelemetryDataService>, SDK::GeneralError> TelemetryDataService::save() {

    auto res = dataFileHandler_->write(toDataFileList());

    if (!res) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "Unknown"));
    }

    return shared_from_this();
  }

  std::size_t TelemetryDataService::size() {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.size();
  }

  TelemetryDataService::DataFileMap &TelemetryDataService::getDataFileMapRef() {
    return dataFiles_;
  }

  std::vector<std::shared_ptr<TelemetryDataFile>> TelemetryDataService::toDataFileList() {
    std::scoped_lock lock(stateMutex_);

    return SDK::Utils::ValuesOf(dataFiles_);
  }

  bool TelemetryDataService::exists(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.contains(nameOrAlias);
  }

  std::optional<fs::path> TelemetryDataService::findFile(const std::shared_ptr<TelemetryDataFile> &dataFile) {
    for (auto &filePath: filePaths_) {
      auto file = filePath / dataFile->filename();
      if (fs::exists(file)) {
        return file;
      }
    }

    return std::nullopt;
  }

  std::shared_ptr<TelemetryDataFile> TelemetryDataService::getByFile(const fs::path &file) {
    std::set<std::string> matchList{file.string(), file.filename().string(), Base64::encode(file.string()),
                                    Base64::encode(file.filename().string())};
    for (auto &[id, dataFile]: dataFiles_) {
      if (matchList.contains(id) || matchList.contains(dataFile->filename()) || matchList.contains(dataFile->id()) ||
          matchList.contains(dataFile->alias())) {
        return dataFile;
      }
    }

    return nullptr;
  }

  bool TelemetryDataService::isAvailable(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return findFile(dataFiles_[nameOrAlias]).has_value();
    }

    return false;
  }

  std::shared_ptr<TelemetryDataFile> TelemetryDataService::get(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return dataFiles_[nameOrAlias];
    }
    return std::shared_ptr<TelemetryDataFile>();
  }

  std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
  TelemetryDataService::set(const std::shared_ptr<TelemetryDataFile> &dataFile) {
    return set(dataFile->id(), dataFile);
  }

  std::expected<const std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
  TelemetryDataService::set(const std::string &id, const std::shared_ptr<TelemetryDataFile> &dataFile) {
    std::scoped_lock lock(stateMutex_);

    // COPY CURRENT MAP
    auto newDataFiles = dataFiles_;

    // TIMESTAMP UPDATED_AT
    auto timestamp = TimeEpoch<std::chrono::milliseconds>().count();
    dataFile->set_updated_at(timestamp);

    // SET MAPPING TO DATA FILE
    newDataFiles[id] = dataFile;

    // WRITE CHANGES TO DISK
    auto res = dataFileHandler_->write(SDK::Utils::ValuesOf(newDataFiles));

    // CHECK ERROR
    if (!res.has_value()) {
      return std::unexpected(res.error());
    }

    // MOVE NEW DATA FILES WITH CHANGES ON TO `dataFiles_` member
    dataFiles_ = std::move(newDataFiles);

    return dataFiles_[id];
  }

  using SubmitRequestResult = std::expected<TelemetryDataService::Result::SharedFuture, SDK::GeneralError>;

  SubmitRequestResult
  TelemetryDataService::submitRequest(const std::vector<fs::path> &files) {
    std::scoped_lock lock(stateMutex_);
    if (!processorThread_) {
      return std::unexpected(SDK::GeneralError(ErrorCode::General, "Processor is not valid and/or started yet, can not submit requests"));
    }

    auto request = processorThread_->submitRequest(files);
    auto future = request->future.share();
    return SubmitRequestResult(future);

  }


} // namespace IRacingTools::Shared::Services
