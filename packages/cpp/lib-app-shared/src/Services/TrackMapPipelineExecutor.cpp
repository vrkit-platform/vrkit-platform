#include <IRacingTools/SDK/Utils/macros.h>
#include <IRacingTools/Shared/Services/TrackMapPipelineExecutor.h>

namespace IRacingTools::Shared::Services {
  TrackMapPipelineExecutor::TrackMapPipelineExecutor() : PipelineExecutor(PIPELINE_TYPE_TRACK_MAP) {
  }

  Pipeline::Attempt &TrackMapPipelineExecutor::execute(Pipeline::Attempt &attempt, const TelemetryDataFile &data) {
    attempt.set_status(PipelineStatus::PIPELINE_STATUS_COMPLETE);
    return attempt;
  }

  

  namespace {
    // void RegisterTrackMapPipelineExecutor() 
    std::shared_ptr<PipelineExecutor<TelemetryDataFile>> TrackMapPipelineExecutorFactory() {
        return std::make_shared<TrackMapPipelineExecutor>();
    };

    INITIALIZER(RegisterTrackMapPipelineExecutor) {
      using namespace IRacingTools::Shared::Services;
      PipelineExecutorRegistry<PIPELINE_TYPE_TRACK_MAP, TelemetryDataFile>::GetPtr()->setFactory(
          TrackMapPipelineExecutor::Create);
    };
  }    
  
}// namespace IRacingTools::Shared::Services

