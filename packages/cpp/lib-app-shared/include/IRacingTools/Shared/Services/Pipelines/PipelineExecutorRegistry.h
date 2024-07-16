#pragma once


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <magic_enum.hpp>

#include <IRacingTools/Models/Pipeline.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>


namespace IRacingTools::Shared::Services::Pipelines {

  using namespace Models;
  
  /**
   * @brief Invoked in pipeline constructor, but is responsible for hydrating all
   *  factories when called.  This will only run once per process
   */
  void PipelineExecutorRegistrySetup();

  /**
   * @brief Interface for creating a pipeline executor factory
   * 
   * @tparam Data 
   */
  template<typename Data>
  using PipelineExecutorFactory = std::function<std::shared_ptr<PipelineExecutor<Data>>()>;

  /**
   * @brief Executor registry
   * 
   * @tparam Type 
   * @tparam Data 
   */
  template<PipelineType Type, typename Data>
  class PipelineExecutorRegistry : public SDK::Utils::Singleton<PipelineExecutorRegistry<Type, Data>> {
  public:

    PipelineExecutorRegistry() = delete;

    /**
     * @brief Set the Factory for the given `Type` & `Data`
     * 
     * @param factory 
     */
    void setFactory(const PipelineExecutorFactory<Data> &factory) {
      factory_ = std::make_optional<PipelineExecutorFactory<Data>>(factory);
    };

    /**
     * @brief Create a new executor instance
     * 
     * @return std::shared_ptr<PipelineExecutor<Data>> 
     */
    std::shared_ptr<PipelineExecutor<Data>> build() {
      PipelineExecutorRegistrySetup();
      if (!factory_) {
        return nullptr;
      }
      auto factory = factory_.value();
      return factory();
    };

  protected:
    /**
     * @brief Singleton constructor
     */
    PipelineExecutorRegistry(SDK::Utils::Singleton<PipelineExecutorRegistry<Type, Data>>::token) {      
    };

    friend SDK::Utils::Singleton<PipelineExecutorRegistry<Type, Data>>;

  private:

    
    /**
     * @brief Holds the factory for the `Type` & `Data` combination
     */
    std::optional<PipelineExecutorFactory<Data>> factory_{std::nullopt};
  };


}// namespace IRacingTools::Shared::Services
