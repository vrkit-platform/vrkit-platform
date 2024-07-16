#pragma once


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <magic_enum.hpp>

#include <IRacingTools/Models/Pipeline.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>

namespace IRacingTools::Shared::Services::Pipelines {

  using namespace Models;
  constexpr std::size_t PipelineTypeCount = magic_enum::enum_count<PipelineType>();
  constexpr auto PipelineTypes = magic_enum::enum_values<PipelineType>();

  template<typename ... Data>
  class PipelineExecutor {
  public:
    PipelineExecutor() = delete;

    explicit PipelineExecutor(PipelineType type) : type_(type) {
    }

    virtual Pipeline::Attempt* execute(Pipeline::Attempt *attempt, const std::shared_ptr<ServiceContainer>& serviceContainer, Data...) = 0;

    virtual ~PipelineExecutor() = default;

    PipelineType type() const {
      return type_;
    }

  private:
    const PipelineType type_;
    PipelineStatus status{PIPELINE_STATUS_CREATED};
  };



}// namespace IRacingTools::Shared::Services
