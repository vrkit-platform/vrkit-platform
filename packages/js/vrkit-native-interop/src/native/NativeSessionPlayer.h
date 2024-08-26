// ReSharper disable once CppParameterMayBeConstPtrOrRef

#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>



#include <IRacingTools/Models/rpc/Messages/SimpleMessages.pb.h>
#include <IRacingTools/Models/rpc/Events/CommonEventTypes.pb.h>
#include <IRacingTools/Models/rpc/Events/SessionEvent.pb.h>

#include <IRacingTools/SDK/Utils/Singleton.h>

#include <IRacingTools/Shared/SessionDataProvider.h>
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
        


    private:
        Napi::Value jsGetSessionInfo(const Napi::CallbackInfo& info);
        Napi::Value jsGetSessionInfoYAML(const Napi::CallbackInfo& info);

        Napi::Value jsGetSessionData(const Napi::CallbackInfo& info);

        Napi::Value jsGetSessionTiming(const Napi::CallbackInfo& info);

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

        std::shared_ptr<Models::Session::SessionData> sessionData_{};
        std::shared_ptr<SessionDataProvider> dataProvider_{};
        std::atomic_bool destroyed_{false};

        std::shared_ptr<NativeGlobal> system_;
        SessionPlayerEventFn jsSessionPlayerEventFn_;

        
        
        
        

    };
}
