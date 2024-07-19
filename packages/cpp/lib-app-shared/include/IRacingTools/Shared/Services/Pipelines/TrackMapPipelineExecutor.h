#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/TelemetryData.pb.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>


#include <IRacingTools/Shared/ProtoHelpers.h>


namespace IRacingTools::Shared::Services::Pipelines {

  using namespace Models;
  
  class TrackMapPipelineExecutor : public PipelineExecutor<std::shared_ptr<TelemetryDataFile>> {

  public:
    static std::shared_ptr<TrackMapPipelineExecutor> Factory() {
      return std::make_shared<TrackMapPipelineExecutor>();
    }

    TrackMapPipelineExecutor();

    virtual std::optional<SDK::GeneralError> execute(PipelineAttemptEditor& attempt,
                                      const std::shared_ptr<ServiceContainer> &serviceContainer,
                                      std::shared_ptr<TelemetryDataFile> data) override;

    virtual ~TrackMapPipelineExecutor() = default;
  };

} // namespace IRacingTools::Shared::Services::Pipelines
