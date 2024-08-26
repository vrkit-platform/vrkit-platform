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
#include "NativeGlobal.h"
using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Models;


namespace IRacingTools::App::Node {
    using namespace Shared::Services;


    /**
   * @brief Holds JavaScript Event for ThreadSafeFunction callbacks
   */
    struct NativeJSDefaultEvent {
        RPC::Events::ClientEventType type;
        std::optional<google::protobuf::Any> data;

        explicit NativeJSDefaultEvent(
            RPC::Events::ClientEventType type,
            std::optional<google::protobuf::Any> data = std::nullopt
        );
    };

    using NativeDefaultEventContextType = Napi::Reference<Napi::Value>;
    using NativeDefaultEventDataType = NativeJSDefaultEvent;
    using NativeDefaultEventFinalizerDataType = void;


    void JSDefaultEventCallback(
        Napi::Env env,
        Napi::Function callback,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeDefaultEventContextType* context,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeDefaultEventDataType* data
    );
    using NativeDefaultEventFn = Napi::TypedThreadSafeFunction<
        NativeDefaultEventContextType, NativeDefaultEventDataType, JSDefaultEventCallback>;

    
    /**
     * @brief NodeSystem client, which can execute RPC calls & exchange information as needed
     */
    class NativeClient : public Napi::ObjectWrap<NativeClient> {
    public:
        static Napi::FunctionReference& Constructor(Napi::Env env) {
            return NativeSystemAddon::fromEnv(env)->clientCtor();
        }

        /**
         * @brief Initialize `node-addon`
         *
         * @param env jsEnv context
         * @param exports to populate with classes & other members
         */
        static void Init(Napi::Env env, Napi::Object exports);

        explicit NativeClient(const Napi::CallbackInfo& info);
        ~NativeClient() override;

        virtual void Finalize(Napi::Env) override;

        Napi::Value jsExecuteRequest(const Napi::CallbackInfo& info);
        Napi::Value jsDestroy(const Napi::CallbackInfo& info);

#ifdef DEBUG
        Napi::Value jsTestNativeEventEmit(const Napi::CallbackInfo& info);
#endif

    private:
        void destroy();

        NativeDefaultEventFn jsDefaultEventFn_;

        std::shared_ptr<NativeGlobal> system_;
        std::atomic_uint32_t pingCount_{0};

        std::mutex destroyMutex_{};
        std::atomic_bool destroyed_{false};

#ifdef DEBUG
        std::mutex jsTestThreadsMutex_{};
        std::vector<std::shared_ptr<std::thread>> jsTestThreads_{};
#endif
    };
}
