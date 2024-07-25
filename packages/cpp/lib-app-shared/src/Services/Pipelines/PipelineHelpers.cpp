
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
#include <IRacingTools/Shared/Services/Pipelines/PipelineHelpers.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>


namespace IRacingTools::Shared::Services::Pipelines {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services;
  namespace {
    auto L = GetCategoryWithType<TelemetryDataService>();
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
    template<typename... Args>
    auto setError(fmt::format_string<Args...> fmt, Args &&...args) {
      auto msg = fmt::format(fmt, std::forward<Args>(args)...);
      error = SDK::GeneralError(ErrorCode::General, msg);
      status = PipelineStatus::PIPELINE_STATUS_ERROR;
      return this;
    }
  };

  template<PipelineType Type>
  ExecutePipelineResult ExecutePipeline(
      TelemetryDataService *service,
      const std::shared_ptr<TelemetryDataFile> &dataFile,
      const fs::path &file) {
    Models::Pipeline *pipeline{nullptr};
    Models::Pipeline::Attempt *attempt{nullptr};

    // TODO: Reimplement all of this
    ExecutePipelineResult result{
        .file = file,
        .dataFileId = dataFile->id(),
        .type = Type,
        .status = PipelineStatus::PIPELINE_STATUS_CREATED};

    // auto persistDataFile = [&]() {
    //   if (auto res = service->save(); !res) {
    //     L->warn(
    //         "Failed to save data file ({}), error: {}",
    //         dataFile->file_info().filename(),
    //         res.error().what());
    //   } else {
    //     L->debug("Save data file ({})", dataFile->file_info().filename());
    //   }
    // };
    //
    // {
    //   std::string id{magic_enum::enum_name<Type>().data()};
    //   // FIND PIPELINE IF ALREADY EXISTS
    //
    //   auto pipelinesCount = dataFile->pipelines_size();
    //   for (std::size_t i = 0; i < pipelinesCount; i++) {
    //     // for (auto it: dataFile->mutable_pipelines()) {
    //     auto it = dataFile->mutable_pipelines(i);
    //     if (it->type() == Type) {
    //       pipeline = it;
    //       break;
    //     }
    //   }
    //
    //   // IF NO EXISTING PIPELINE WAS FOUND, CREATE ONE
    //   if (!pipeline) {
    //     pipeline = dataFile->add_pipelines();
    //     pipeline->set_id(id);
    //     pipeline->set_type(Type);
    //     pipeline->set_status(PipelineStatus::PIPELINE_STATUS_PROCESSING);
    //   }
    //
    //   // CREATE A NEW ATTEMPT INSTANCE
    //   auto attemptCount = pipeline->attempts_size();
    //   auto attemptNumber = attemptCount + 1;
    //
    //   attempt = pipeline->add_attempts();
    //   auto attemptMillis = TimeEpoch().count();
    //   auto attemptId = std::format("{}_{}", id, attemptMillis);
    //   attempt->set_id(attemptId);
    //   attempt->set_timestamp(attemptMillis);
    //   attempt->set_attempt_number(attemptNumber);
    //   attempt->set_status(Models::PipelineStatus::PIPELINE_STATUS_CREATED);
    // }
    //
    //
    // auto executor =
    //     PipelineExecutorRegistry<Type, std::shared_ptr<TelemetryDataFile>>::
    //         GetPtr()
    //             ->build();
    // if (!executor) {
    //   // result.setError("Executor not found for type ({})", Type);
    //   result.setError(
    //       "Executor not found for type ({})",
    //       magic_enum::enum_name(Type).data());
    //   return result;
    // }
    //
    // PipelineExecutor<std::shared_ptr<TelemetryDataFile>>::PipelineAttemptEditor
    //     attemptEditor(pipeline, attempt);
    // auto res =
    //     executor->execute(attemptEditor, service->getContainer(), dataFile);
    // if (res) {
    //   auto error = res.value();
    //   result.setError("Failed to execute pipeline: {}", error.what());
    //   return result;
    // }

    result.status = PIPELINE_STATUS_COMPLETE;
    return result;
  }

  std::expected<std::vector<ExecutePipelineResult>, SDK::GeneralError>
  ExecutePipelines(
      TelemetryDataService *service,
      const std::shared_ptr<TelemetryDataFile> &dataFile,
      const fs::path &file) {

    std::vector<ExecutePipelineResult> results{};
    results.push_back(
        ExecutePipeline<PIPELINE_TYPE_TRACK_MAP>(service, dataFile, file));
    return results;
  }

} // namespace IRacingTools::Shared::Services