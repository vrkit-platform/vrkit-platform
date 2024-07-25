
#include <chrono>
#include <deque>
#include <fstream>
#include <magic_enum.hpp>

#include <google/protobuf/util/json_util.h>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/RunnableThread.h>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

#include "TelemetryDataFileProcessor.h"

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  namespace {
    auto L = GetCategoryWithType<TelemetryDataFileProcessor>();
    std::mutex gProcessorMutex{};
    std::atomic_size_t gRequestIdSeq{0};

    std::expected<std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
    CreateTelemetryDataFile(
        TelemetryDataService *service, const fs::path &file) {
      auto fileEncoded = Base64::encode(file.string());
      auto dataFile = std::make_shared<TelemetryDataFile>();

      dataFile->set_id(fileEncoded);
      dataFile->set_alias(file.filename().string());

      auto fileInfo = dataFile->mutable_file_info();

      if (auto fileInfoRes = GetFileInfo(fileInfo, file); !fileInfoRes) {
        auto &err = fileInfoRes.error();
        return std::unexpected(err);
      }

      auto tlmRes = service->getTrackLayoutMetadata(file);
      if (!tlmRes)
        return std::unexpected(tlmRes.error());

      auto tlm = tlmRes.value();
      dataFile->mutable_track_layout_metadata()->CopyFrom(*tlm);
      L->debug(
          "track_layout_metadata ({}): {}", file.string(), tlm->DebugString());

      dataFile->set_status(TelemetryDataFile::STATUS_CREATED);

      return dataFile;
    }
  } // namespace


  TelemetryDataFileProcessor::TelemetryDataFileProcessor(
      TelemetryDataService *service)
      : service_(service) {
  }
  std::shared_ptr<TelemetryDataFileProcessor::Request>
  TelemetryDataFileProcessor::findRequestInternal(
      const std::vector<fs::path> &files) {
    std::shared_ptr<Request> request{nullptr};


    // IF REQUESTS ARE PENDING & NO SPECIFIC FILE SPECIFIED
    if (!requests_.empty()) {
      for (auto &it: requests_) {
        if (it->files.empty() && files.empty()) {
          request = it;
          break;
        }

        if (!it->files.empty() && !files.empty() &&
            std::ranges::all_of(files, [&](auto &file) {
              return std::find(it->files.begin(), it->files.end(), file) !=
                     std::end(it->files);
            })) {
          request = it;
          break;
        }
      }
    }

    return request;
  }
  std::shared_ptr<TelemetryDataFileProcessor::Request>
  TelemetryDataFileProcessor::findRequest(const std::vector<fs::path> &files) {
    std::shared_ptr<Request> request{nullptr};
    {
      std::scoped_lock lock(requestMutex_);

      // FIND EXISTING REQUEST FIRST IF ONE EXISTS
      request = findRequestInternal(files);
    }
    return request;
  }
  std::shared_ptr<TelemetryDataFileProcessor::Request>
  TelemetryDataFileProcessor::submitRequest(
      const std::vector<fs::path> &files) {

    std::shared_ptr<Request> request{nullptr};

    {
      std::scoped_lock lock(requestMutex_);

      // FIND EXISTING REQUEST FIRST IF ONE EXISTS
      request = findRequestInternal(files);

      if (!request) {
        // requests_.empty() || !files.empty()
        Result::Promise promise{};
        auto future = promise.get_future();
        request = requests_.emplace_back(new Request{
            .id = gRequestIdSeq++,
            .timestamp = std::chrono::high_resolution_clock::now(),
            .files = files,
            .promise = std::move(promise),
            .future = std::move(future)});

        requestCondition_.notify_all();
      }
    }

    return request;
  }
  void TelemetryDataFileProcessor::runnable() {
    std::unique_lock<std::mutex> singletonLock(
        gProcessorMutex, std::defer_lock);
    VRK_LOG_AND_FATAL_IF(
        !singletonLock.try_lock(),
        "Unable to acquire singleton processing lock");

    while (isRunning()) {
      isProcessing_ = false;
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

        isProcessing_ = !!request;
      }

      if (!request)
        continue;


      L->info("Processing request (id={})", request->id);
      auto &result = request->result = std::make_shared<Result>();
      result->status = Result::Status::Processing;

      auto requestedFiles = request->files.empty()
                                ? service_->listTelemetryFiles()
                                : request->files;
      auto &unprocessedFiles = result->unprocessedFiles =
          std::deque(requestedFiles.begin(), requestedFiles.end());
      auto &processedFiles = result->processedFiles;
      auto &failedFiles = result->failedFiles;

      while (!unprocessedFiles.empty()) {
        auto file = unprocessedFiles.front();
        unprocessedFiles.pop_front();
        if (fs::is_directory(file)) {
          continue;
        }

        L->debug("Checking {}", file.string());
        // TODO: Check FileInfo modified_at timestamp to see if its changed
        //   before skipping
        auto dataFile = service_->getByFile(file);

        // CHECK IF THE TIMESTAMP HAS CHANGED
        if (dataFile) {
          // GET THE LATEST FILE TIMESTAMPS
          auto dataFileTimestampsRes = GetFileTimestamps(file);
          if (!dataFileTimestampsRes) {
            L->warn(
                "Unable to get timestamps for ({}), failing the file: {}",
                file.string(),
                dataFileTimestampsRes.error().what());
            failedFiles.emplace_back(file, dataFileTimestampsRes.error());
            continue;
          }

          // CHECK THE TIMESTAMPS
          auto &dataFileTimestamps = dataFileTimestampsRes.value();
          auto dataFileModifiedAtNow = ToSeconds(dataFileTimestamps.modifiedAt);
          auto dataFileModifiedAt = dataFile->file_info().modified_at();

          // IF NO CHANGE, MARK AS PROCESSED
          if (dataFileModifiedAtNow <= dataFileModifiedAt) {
            L->debug("Ignoring telemetry file ({}) as it has already been "
                     "ingested");
            processedFiles.emplace_back(file, dataFile);
            continue;
          }

          // UPDATE WITH NEW `modifiedAt`
          L->debug(
              "File ({}) has been updated (currentModifiedAt={},modifiedAt={})",
              file.string(),
              dataFileModifiedAtNow,
              dataFileModifiedAt);
          dataFile->mutable_file_info()->set_modified_at(dataFileModifiedAtNow);
        }

        // IF NO FILE EXISTS IN THE SERVICE
        if (!dataFile) {
          auto dataFileRes = CreateTelemetryDataFile(service_, file);
          if (!dataFileRes) {
            failedFiles.emplace_back(file, dataFileRes.error());
            continue;
          }

          dataFile = dataFileRes.value();
        }

        // TODO: FOR REFERENCE, PIPELINES USED TO BE HERE

        processedFiles.emplace_back(file, dataFile);
        dataFile->set_status(TelemetryDataFile::STATUS_AVAILABLE);

        service_->set(dataFile);
      }

      result->status = Result::Status::Complete;

      L->info(
          "Processed request (id={},status={})",
          request->id,
          magic_enum::enum_name(result->status).data());


      // if (initialRequestId_.value() == request->id) {
      //   std::vector<std::shared_ptr<TelemetryDataFile>> newProcessedFiles{};
      //   for (auto &processedFile: processedFiles | std::views::values) {
      //     newProcessedFiles.push_back(processedFile);
      //   }
      //   // std::copy(processedFiles.begin(), processedFiles.end(),
      //   // std::back_insert_iterator(newProcessedFiles));
      //   service_->set(newProcessedFiles);
      //   service_->events.onInitialRequestComplete.publish(service_);
      // }
      request->promise.set_value(result);
      service_->events.onRequestComplete.publish(service_,request->result, request);
    }
  }
  bool TelemetryDataFileProcessor::isProcessing() {
    std::scoped_lock lock(requestMutex_);
    return isProcessing_ || !requests_.empty();
  }


} // namespace IRacingTools::Shared::Services
