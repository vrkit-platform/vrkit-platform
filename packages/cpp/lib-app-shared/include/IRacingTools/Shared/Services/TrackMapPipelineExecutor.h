#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/TelemetryData.pb.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>

#include <IRacingTools/Shared/ProtoHelpers.h>


namespace IRacingTools::Shared::Services {
    
    using namespace Models;    
    using Telemetry::TelemetryDataFile;

    class TrackMapPipelineExecutor : public PipelineExecutor<TelemetryDataFile>  {
        
        public:
        static std::shared_ptr<TrackMapPipelineExecutor> Create() {
            return std::make_shared<TrackMapPipelineExecutor>();
        }

        TrackMapPipelineExecutor();        

        virtual Pipeline::Attempt& execute(Pipeline::Attempt& attempt, const TelemetryDataFile& data) override;

        virtual ~TrackMapPipelineExecutor() = default;
    };

} // namespace IRacingTools::Shared::Geometry
