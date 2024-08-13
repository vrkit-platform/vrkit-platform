#pragma once
#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/SDK/Utils/Singleton.h>



#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>

#include <IRacingTools/Shared/Services/ServiceManager.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/RPCServerService.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Models;


namespace IRacingTools::App::Node {
using namespace Shared::Services;

  using NodeSystemManager = ServiceManager<RPCServerService,TelemetryDataService,TrackMapService>;
  using NodeSystemManagerPtr = std::shared_ptr<NodeSystemManager>;

  /**
   * @brief Global (cross-thread) system manager/holder
   */
  class NodeSystemGlobal : public Singleton<NodeSystemGlobal> {

  public:

    NodeSystemGlobal() = delete;
    NodeSystemGlobal(const NodeSystemGlobal &) = delete;
    NodeSystemGlobal(NodeSystemGlobal &&) = delete;

    void destroy();
    NodeSystemManagerPtr serviceManager() const {
      return manager_;
    };

  private:

    friend Singleton;
    explicit NodeSystemGlobal(token);

    const NodeSystemManagerPtr manager_;
  };


  class NodeSystemAddon
  {
  public:
    static void Init(Napi::Env env, Napi::Object exports)
    {
      env.SetInstanceData(new NodeSystemAddon());
    }

    static NodeSystemAddon *fromEnv(const Napi::Env &env)
    {
      return env.GetInstanceData<NodeSystemAddon>();
    }

    NodeSystemAddon();

    Napi::FunctionReference & clientCtor();
    std::shared_ptr<NodeSystemGlobal> system() const {
      return system_;
    }

  private:
    Napi::FunctionReference clientCtor_;
    const std::shared_ptr<NodeSystemGlobal> system_;
  };

  /**
   * @brief NodeSystem client, which can execute RPC calls & exchange information as needed
   */
  class NodeSystemClient : public Napi::ObjectWrap<NodeSystemClient> {
    std::atomic_uint32_t pingCount_{0};
    public:
    static Napi::FunctionReference &Constructor(Napi::Env env)
    {
      return NodeSystemAddon::fromEnv(env)->clientCtor();
    }

    /**
     * @brief Initialize `node-addon`
     *
     * @param env jsEnv context
     * @param exports to populate with classes & other members
     */
    static void Init(Napi::Env env, Napi::Object exports);

    explicit NodeSystemClient(const Napi::CallbackInfo &info);
    ~NodeSystemClient() override;

    Napi::Value jsExecuteRequest(const Napi::CallbackInfo &info);

  private:
    std::shared_ptr<NodeSystemGlobal> system_;
  };

}