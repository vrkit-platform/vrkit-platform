// ReSharper disable once CppParameterMayBeConstPtrOrRef

#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/rpc/Messages/SimpleMessages.pb.h>
#include <IRacingTools/Models/rpc/Events/CommonEventTypes.pb.h>
#include <IRacingTools/Models/rpc/Events/SessionEvent.pb.h>

#include <IRacingTools/SDK/Utils/Singleton.h>


#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>

#include <IRacingTools/Shared/Services/ServiceManager.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/RPCServerService.h>

#include <napi.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Models;


namespace IRacingTools::App::Node {
    using namespace Shared::Services;

    using VRKitNativeSystemManager = ServiceManager<RPCServerService, TelemetryDataService, TrackMapService>;
    using VRKitNativeSystemManagerPtr = std::shared_ptr<VRKitNativeSystemManager>;

    /**
     * @brief Global (cross-thread) system manager/holder
     */
    class VRKitNativeGlobal : public Singleton<VRKitNativeGlobal> {
    public:
        VRKitNativeGlobal() = delete;
        VRKitNativeGlobal(const VRKitNativeGlobal&) = delete;
        VRKitNativeGlobal(VRKitNativeGlobal&&) = delete;

        void destroy();

        VRKitNativeSystemManagerPtr serviceManager() const {
            return manager_;
        }

    private:
        friend Singleton;
        explicit VRKitNativeGlobal(token);

        const VRKitNativeSystemManagerPtr manager_;
    };

    void VRKitShutdown();

    /**
   * @brief Holds JavaScript Event for ThreadSafeFunction callbacks
   */
    struct VRKitNativeJSDefaultEvent {
        RPC::Events::ClientEvent type;
        std::optional<google::protobuf::Any> data;

        explicit VRKitNativeJSDefaultEvent(
            RPC::Events::ClientEvent type,
            std::optional<google::protobuf::Any> data = std::nullopt
        );
    };

    using VRKitNativeDefaultEventContextType = Napi::Reference<Napi::Value>;
    using VRKitNativeDefaultEventDataType = VRKitNativeJSDefaultEvent;
    using VRKitNativeDefaultEventFinalizerDataType = void;


    void JSDefaultEventCallback(
        Napi::Env env,
        Napi::Function callback,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        VRKitNativeDefaultEventContextType* context,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        VRKitNativeDefaultEventDataType* data
    );
    using VRKitNativeDefaultEventFn = Napi::TypedThreadSafeFunction<
        VRKitNativeDefaultEventContextType, VRKitNativeDefaultEventDataType, JSDefaultEventCallback>;

    class VRKitNativeSystemAddon {
    public:
        static void Init(Napi::Env env, Napi::Object _ /* exports */) {
            env.SetInstanceData(new VRKitNativeSystemAddon());
        }

        static VRKitNativeSystemAddon* fromEnv(const Napi::Env& env) {
            return env.GetInstanceData<VRKitNativeSystemAddon>();
        }

        VRKitNativeSystemAddon();

        Napi::FunctionReference& clientCtor();

        std::shared_ptr<VRKitNativeGlobal> system() const {
            return system_;
        }

    private:
        Napi::FunctionReference clientCtor_;
        const std::shared_ptr<VRKitNativeGlobal> system_;
    };

    /**
     * @brief NodeSystem client, which can execute RPC calls & exchange information as needed
     */
    class VRKitNativeClient : public Napi::ObjectWrap<VRKitNativeClient> {
    public:
        static Napi::FunctionReference& Constructor(Napi::Env env) {
            return VRKitNativeSystemAddon::fromEnv(env)->clientCtor();
        }

        /**
         * @brief Initialize `node-addon`
         *
         * @param env jsEnv context
         * @param exports to populate with classes & other members
         */
        static void Init(Napi::Env env, Napi::Object exports);

        explicit VRKitNativeClient(const Napi::CallbackInfo& info);
        ~VRKitNativeClient() override;

        virtual void Finalize(Napi::Env) override;

        Napi::Value jsExecuteRequest(const Napi::CallbackInfo& info);
        Napi::Value jsDestroy(const Napi::CallbackInfo& info);

#ifdef DEBUG
        Napi::Value jsTestNativeEventEmit(const Napi::CallbackInfo& info);
#endif

    private:
        void destroy();

        VRKitNativeDefaultEventFn jsDefaultEventFn_;

        std::shared_ptr<VRKitNativeGlobal> system_;
        std::atomic_uint32_t pingCount_{0};

        std::mutex destroyMutex_{};
        std::atomic_bool destroyed_{false};

#ifdef DEBUG
        std::mutex jsTestThreadsMutex_{};
        std::vector<std::shared_ptr<std::thread>> jsTestThreads_{};
#endif
    };
}
