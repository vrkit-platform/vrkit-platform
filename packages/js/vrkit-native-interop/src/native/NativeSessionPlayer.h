// ReSharper disable once CppParameterMayBeConstPtrOrRef

#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>


#include <VRKit/Models/rpc/Messages/SimpleMessages.pb.h>
#include <VRKit/Models/rpc/Events/CommonEventTypes.pb.h>
#include <VRKit/Models/rpc/Events/SessionEvent.pb.h>

#include <IRacingSDK/Utils/Singleton.h>

#include <VRKit/Shared/SessionDataProvider.h>
#include <VRKit/Shared/Services/TelemetryDataService.h>
#include <VRKit/Shared/Services/TrackMapService.h>

#include <VRKit/Shared/Services/ServiceManager.h>

#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Services/RPCServerService.h>

#include <napi.h>
#include "NativeGlobal.h"
using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;
using namespace VRKit::Models;


namespace VRKit::App::Node {
  using namespace Shared::Services;


  /**
 * @brief Holds JavaScript Event for ThreadSafeFunction callbacks
 */
  struct NativeSessionPlayerJSEvent {
    RPC::Events::SessionEventType type;
    std::shared_ptr<RPC::Events::SessionEventData> data;

    explicit NativeSessionPlayerJSEvent(
      RPC::Events::SessionEventType type,
      const std::shared_ptr<RPC::Events::SessionEventData>& data = nullptr
    );
  };

  using NativeSessionPlayerEventContextType = Napi::Reference<Napi::Value>;
  using NativeSessionPlayerEventDataType = NativeSessionPlayerJSEvent;
  using NativeSessionPlayerEventFinalizerDataType = void;


  void JSSessionPlayerEventCallback(
    Napi::Env env,
    Napi::Function callback,
    // ReSharper disable once CppParameterMayBeConstPtrOrRef
    NativeSessionPlayerEventContextType* context,
    // ReSharper disable once CppParameterMayBeConstPtrOrRef
    NativeSessionPlayerEventDataType* data
  );

  using SessionPlayerEventFn = Napi::TypedThreadSafeFunction<
    NativeSessionPlayerEventContextType, NativeSessionPlayerEventDataType, JSSessionPlayerEventCallback>;


  /**
   * @brief NodeSystem client, which can execute RPC calls & exchange information as needed
   */
  class NativeSessionPlayer : public Napi::ObjectWrap<NativeSessionPlayer> {
    public:

      static Napi::FunctionReference& Constructor(Napi::Env env) {
        return NativeSystemAddon::fromEnv(env)->sessionPlayerCtor();
      }

      /**
       * @brief Initialize `node-addon`
       *
       * @param env jsEnv context
       * @param exports to populate with classes & other members
       */
      static void Init(Napi::Env env, Napi::Object exports);

      explicit NativeSessionPlayer(const Napi::CallbackInfo& info);

      ~NativeSessionPlayer() override;

      bool isLive() const {
        return !filePath_.has_value();
      }

      virtual void Finalize(Napi::Env) override;

      std::shared_ptr<SessionDataProvider> dataProvider();

    private:

      Napi::Value jsGetId(const Napi::CallbackInfo& info);

      Napi::Value jsGetNamedPipePath(const Napi::CallbackInfo& info);

      Napi::Value jsGetDataVariable(const Napi::CallbackInfo& info);

      Napi::Value jsGetDataVariableHeaders(const Napi::CallbackInfo& info);

      Napi::Value jsGetSessionInfoYAMLStr(const Napi::CallbackInfo& info);

      Napi::Value jsGetSessionTicks(const Napi::CallbackInfo& info);

      Napi::Value jsGetSessionTickCount(const Napi::CallbackInfo& info);

      Napi::Value jsGetSessionMetadata(const Napi::CallbackInfo& info);

      Napi::Value jsGetSessionTiming(const Napi::CallbackInfo& info);

      Napi::Value jsIsAvailable(const Napi::CallbackInfo& info);

      Napi::Value jsIsLive(const Napi::CallbackInfo& info);

      Napi::Value jsGetFileInfo(const Napi::CallbackInfo& info);

      Napi::Value jsStop(const Napi::CallbackInfo& info);

      Napi::Value jsStart(const Napi::CallbackInfo& info);

      Napi::Value jsResume(const Napi::CallbackInfo& info);

      Napi::Value jsPause(const Napi::CallbackInfo& info);

      Napi::Value jsIsPaused(const Napi::CallbackInfo& info);

      Napi::Value jsSeek(const Napi::CallbackInfo& info);

      Napi::Value jsDestroy(const Napi::CallbackInfo& info);

      void destroy();

      std::mutex sessionStateMutex_{};
      std::mutex destroyMutex_{};
      std::optional<std::filesystem::path> filePath_{std::nullopt};

      std::shared_ptr<Models::Session::SessionMetadata> sessionData_{};
      std::shared_ptr<SessionDataProvider> dataProvider_{};

      // TODO: Add IPC server to the session player including start/stop functionality
      //  * also, expose the generated IPC server named pipe path to the JS side
      std::shared_ptr<IRacingIPCServer> ipcServer_{};
      std::atomic_bool destroyed_{false};

      std::shared_ptr<NativeGlobal> system_;
      SessionPlayerEventFn jsSessionPlayerEventFn_;
      std::string id_;


  };
}
