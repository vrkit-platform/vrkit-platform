#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <VRKit/Models/TelemetryDataFile.pb.h>

#include <VRKit/Shared/FileWatcher.h>
#include <VRKit/Shared/ProtoHelpers.h>
#include <VRKit/Shared/Services/Pipelines/PipelineExecutor.h>
#include <VRKit/Shared/Services/Service.h>


#include <VRKit/Shared/ProtoHelpers.h>


namespace VRKit::Shared::Services::Pipelines {

  using namespace Models;
  
  class TrackMapPipelineExecutor : public PipelineExecutor<std::shared_ptr<TelemetryDataFile>> {

  public:
    static std::shared_ptr<TrackMapPipelineExecutor> Factory() {
      return std::make_shared<TrackMapPipelineExecutor>();
    }

    TrackMapPipelineExecutor();

    virtual std::optional<IRacingSDK::GeneralError> execute(PipelineAttemptEditor& attempt,
                                      const std::shared_ptr<ServiceContainer> &serviceContainer,
                                      std::shared_ptr<TelemetryDataFile> data) override;

    virtual ~TrackMapPipelineExecutor() = default;
  };

} // namespace VRKit::Shared::Services::Pipelines
