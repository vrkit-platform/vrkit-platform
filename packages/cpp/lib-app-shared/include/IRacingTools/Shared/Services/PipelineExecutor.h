#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/Pipeline.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>

#include <IRacingTools/Shared/ProtoHelpers.h>


namespace IRacingTools::Shared::Services {

  using namespace Models;

  template<typename Data> class PipelineExecutor {
  public:
    PipelineExecutor() = delete;

    explicit PipelineExecutor(PipelineType type) : type_(type) {
    }

    virtual Pipeline::Attempt &execute(Pipeline::Attempt &attempt, const Data &data) = 0;

    virtual ~PipelineExecutor() = default;

    PipelineType type() const {
      return type_;
    }

  private:
    const PipelineType type_;
    PipelineStatus status{PIPELINE_STATUS_CREATED};
  };


  template<typename Data> 
  using PipelineExecutorFactory = std::function<std::shared_ptr<PipelineExecutor<Data>>()>;

  /**
   * @brief Executor registry
   * 
   * @tparam Type 
   * @tparam Data 
   */
  template<PipelineType Type, typename Data> class PipelineExecutorRegistry
      : public SDK::Utils::Singleton<PipelineExecutorRegistry<Type, Data>> {
  public:
    

    void setFactory(const PipelineExecutorFactory<Data> &factory) {
      factory_ = std::make_optional<PipelineExecutorFactory<Data>>(factory);
    };

    std::shared_ptr<PipelineExecutor<Data>> build();

  protected:
    PipelineExecutorRegistry(SDK::Utils::Singleton<PipelineExecutorRegistry<Type, Data>>::token){};
    friend SDK::Utils::Singleton;

  private:
    PipelineExecutorRegistry() = delete;
    std::optional<PipelineExecutorFactory<Data>> factory_{std::nullopt};
  };


}// namespace IRacingTools::Shared::Services
