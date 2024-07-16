#include <IRacingTools/SDK/Utils/macros.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/Pipelines/TrackMapPipelineExecutor.h>
namespace IRacingTools::Shared::Services::Pipelines {
  namespace {
    auto L = Logging::GetCategoryWithType<TrackMapPipelineExecutor>();
  }

  TrackMapPipelineExecutor::TrackMapPipelineExecutor() : PipelineExecutor(PIPELINE_TYPE_TRACK_MAP) {
  }

  Pipeline::Attempt* TrackMapPipelineExecutor::execute(Pipeline::Attempt *attempt,
                                                      const std::shared_ptr<ServiceContainer> &serviceContainer,
                                                      std::shared_ptr<TelemetryDataFile> data) {
    attempt->set_status(PipelineStatus::PIPELINE_STATUS_PROCESSING);
    auto addLog = [&](const std::string &message) {
      auto attemptLog = attempt->add_logs();
      attemptLog->append(message);
    };
    auto onError = [&](const std::string &message) {
      attempt->set_status(PipelineStatus::PIPELINE_STATUS_ERROR);
      addLog(message);
      return attempt;
    };

    fs::path file{data->filename()};
    if (!fs::exists(file)) {
      auto msg = std::format("File does not exist >> {}", file.string());
      L->error(msg);
      return onError(msg);
    }

    LapTrajectoryTool tool;
    auto res = tool.createLapTrajectory(file);
    if (!res) {
      auto err = res.error();
      auto msg = std::format("Failed to generate lap trajectory >> {}", err.what());
      L->error(msg);
      return onError(msg);
    }

    attempt->set_status(PipelineStatus::PIPELINE_STATUS_COMPLETE);
    return attempt;
  }


} // namespace IRacingTools::Shared::Services::Pipelines
