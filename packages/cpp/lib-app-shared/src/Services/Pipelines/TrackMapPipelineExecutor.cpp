#include <IRacingSDK/Utils/SDKMacros.h>
#include <VRKit/Shared/Services/LapTrajectoryTool.h>
#include <VRKit/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <VRKit/Shared/Services/Pipelines/TrackMapPipelineExecutor.h>
#include <VRKit/Shared/Services/TrackMapService.h>
#include <VRKit/Shared/Utils/SessionInfoHelpers.h>

namespace VRKit::Shared::Services::Pipelines {
  namespace {
    auto L = Logging::GetCategoryWithType<TrackMapPipelineExecutor>();
  }

  TrackMapPipelineExecutor::TrackMapPipelineExecutor() : PipelineExecutor(PIPELINE_TYPE_TRACK_MAP) {
  }

  std::optional<IRacingSDK::GeneralError> TrackMapPipelineExecutor::execute(PipelineAttemptEditor& attempt,
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

    fs::path file{data->file_info().filename()};
    if (!fs::exists(file)) {
      return onError("File does not exist >> {}", file.string());
    }

    auto tmService = serviceContainer->getService<TrackMapService>();
    VRK_LOG_AND_FATAL_IF(!tmService, "Unable to get valid TrackMapService");

    L->info("Calling createLapTrajectory with ({})", file.string());
    auto client = std::make_shared<IRacingSDK::DiskClient>(file, file.string());
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

    // auto& lt = res.value();
    // L->info("Created LapTrajectory for trackLayoutId ({})", lt->track_layout_metadata().id());
    // if (auto setRes = tmService->set(lt); !setRes) {
    //   auto err = setRes.error();
    //   return onError("Failed to generate lap trajectory >> {}", err.what());
    // }
    // L->info("Saved LapTrajectory for trackLayoutId ({})", lt->track_layout_metadata().id());
    // attempt.setStatus(PipelineStatus::PIPELINE_STATUS_COMPLETE);
    return std::nullopt;
  }


} // namespace VRKit::Shared::Services::Pipelines
