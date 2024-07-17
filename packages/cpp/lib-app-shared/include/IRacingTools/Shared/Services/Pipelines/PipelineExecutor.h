#pragma once


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <magic_enum.hpp>

#include <IRacingTools/Models/Pipeline.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/TupleHelpers.h>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>

namespace IRacingTools::Shared::Services::Pipelines {
  using namespace Logging;
  using namespace Models;
  using namespace SDK::Utils;
  constexpr std::size_t PipelineTypeCount = magic_enum::enum_count<PipelineType>();
  constexpr auto PipelineTypes = magic_enum::enum_values<PipelineType>();
  // using PipelineTypesTupleType = std::tuple<decltype(PipelineType::PIPELINE_TYPE_TRACK_MAP)>;
  // static_assert(std::size(PipelineTypes) == std::tuple_size_v<PipelineTypesTupleType>);

  template<typename ... Data>
  class PipelineExecutor {
  public:
    struct PipelineAttemptEditor {
      Pipeline* pipeline;
      Pipeline::Attempt *attempt;
      
      void setStatus(PipelineStatus newStatus) {
        attempt->set_status(newStatus);
      }
      
      void log(Logging::LevelType level, const std::string& message) {
        auto attemptLog = attempt->add_logs();
        attemptLog->set_level((PipelineLog::Level) level);
        attemptLog->set_message(message);
      };

      template <typename... Args>
      void log(Logging::LevelType level, fmt::format_string<Args...> fmt, Args&&... args) {
        auto msg = fmt::format(fmt, std::forward<Args>(args)...);
        log(level, msg);  
      };
      
      PipelineAttemptEditor(Pipeline* pipeline, Pipeline::Attempt *attempt) : pipeline(pipeline), attempt(attempt) {
        
      }

    };
    PipelineExecutor() = delete;

    explicit PipelineExecutor(PipelineType type) : type_(type) {
    }

    virtual std::optional<SDK::GeneralError> execute(PipelineAttemptEditor& attempt, const std::shared_ptr<ServiceContainer>& serviceContainer, Data...) = 0;

    virtual ~PipelineExecutor() = default;

    PipelineType type() const {
      return type_;
    }

  private:
    const PipelineType type_;
    PipelineStatus status{PIPELINE_STATUS_CREATED};
  };



}// namespace IRacingTools::Shared::Services
