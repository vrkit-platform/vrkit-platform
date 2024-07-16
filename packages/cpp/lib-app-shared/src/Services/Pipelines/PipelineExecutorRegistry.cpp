#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/Pipelines/TrackMapPipelineExecutor.h>

namespace IRacingTools::Shared::Services::Pipelines {
  namespace {
    std::atomic_bool gSetupComplete{false};
    std::mutex gSetupMutex{};
  }// namespace

  void PipelineExecutorRegistrySetup() {
    std::scoped_lock lock(gSetupMutex);
    if (gSetupComplete.exchange(true)) {
      return;
    }

    // INSTALL ALL PIPELINE FACTORIES
    PipelineExecutorRegistry<PIPELINE_TYPE_TRACK_MAP, std::shared_ptr<TelemetryDataFile>>::Get().setFactory(
        TrackMapPipelineExecutor::Factory);
  };
}// namespace IRacingTools::Shared::Services
