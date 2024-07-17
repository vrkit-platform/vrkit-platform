#include <IRacingTools/SDK/Utils/macros.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/Pipelines/TrackMapPipelineExecutor.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>

namespace IRacingTools::Shared::Services::Pipelines {
  namespace {
    auto L = Logging::GetCategoryWithType<TrackMapPipelineExecutor>();
  }

  TrackMapPipelineExecutor::TrackMapPipelineExecutor() : PipelineExecutor(PIPELINE_TYPE_TRACK_MAP) {
  }

  std::optional<SDK::GeneralError> TrackMapPipelineExecutor::execute(PipelineAttemptEditor& attempt,
                                                      const std::shared_ptr<ServiceContainer> &serviceContainer,
                                                      std::shared_ptr<TelemetryDataFile> data) {
    
    attempt.setStatus(PipelineStatus::PIPELINE_STATUS_PROCESSING);
    
    auto onError = [&]<typename... Args>(fmt::format_string<Args...> fmt, Args&&... args) {
      std::string message = fmt::format(fmt,std::forward<Args>(args)...);
      L->error(message);
      attempt.setStatus(PipelineStatus::PIPELINE_STATUS_ERROR);
      attempt.log(Logging::LevelType::err, message);
      return GeneralError(ErrorCode::General, message);
    };

    fs::path file{data->filename()};
    if (!fs::exists(file)) {
      return onError("File does not exist >> {}", file.string());
    }

    auto tmService = serviceContainer->getService<TrackMapService>();
    IRT_LOG_AND_FATAL_IF(!tmService, "Unable to get valid TrackMapService");

    L->info("Calling createLapTrajectory with ({})", file.string());
    auto client = std::make_shared<SDK::DiskClient>(file, file.string());
    auto sessionInfo = client->getSessionInfo().lock();
    std::string trackLayoutId;
    {
      auto res = Utils::GetSessionInfoTrackLayoutId(sessionInfo);
      if (!res){
        L->warn("Invalid IBT file, can not get track layout id: {}", file.string());
        return std::nullopt;
      }
      trackLayoutId = res.value();
    }

    if (tmService->isAvailable(trackLayoutId)) {
      L->info("A track map for ({}) already exists", trackLayoutId);
      return std::nullopt;
    }
    
    LapTrajectoryTool tool;
    auto res = tool.createLapTrajectory(client);
    if (!res) {
      auto err = res.error();
      return onError("Failed to generate lap trajectory >> {}", err.what());
    }

    auto& lt = res.value();
    L->info("Created LapTrajectory for trackLayoutId ({})", lt->track_layout_id());
    if (auto res = tmService->set(lt); !res) {
      auto err = res.error();
      return onError("Failed to generate lap trajectory >> {}", err.what());
    }
    L->info("Saved LapTrajectory for trackLayoutId ({})", lt->track_layout_id());
    attempt.setStatus(PipelineStatus::PIPELINE_STATUS_COMPLETE);
    return std::nullopt;
  }


} // namespace IRacingTools::Shared::Services::Pipelines
