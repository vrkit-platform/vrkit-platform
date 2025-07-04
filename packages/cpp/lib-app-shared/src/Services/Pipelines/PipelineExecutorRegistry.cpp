#include <VRKit/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <VRKit/Shared/Services/Pipelines/TrackMapPipelineExecutor.h>

namespace VRKit::Shared::Services::Pipelines {
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
}// namespace VRKit::Shared::Services
