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

    using NativeSystemManager = ServiceManager<RPCServerService, TelemetryDataService, TrackMapService>;
    using NativeSystemManagerPtr = std::shared_ptr<NativeSystemManager>;

    /**
     * @brief Global (cross-thread) system manager/holder
     */
    class NativeGlobal : public Singleton<NativeGlobal> {
    public:
        NativeGlobal() = delete;
        NativeGlobal(const NativeGlobal&) = delete;
        NativeGlobal(NativeGlobal&&) = delete;

        void destroy();

        NativeSystemManagerPtr serviceManager() const {
            return manager_;
        }

    private:
        friend Singleton;
        explicit NativeGlobal(token);

        const NativeSystemManagerPtr manager_;
    };
    
    class NativeSystemAddon {
    public:
        static void Init(Napi::Env env, Napi::Object _ /* exports */) {
            env.SetInstanceData(new NativeSystemAddon());
        }

        static NativeSystemAddon* fromEnv(const Napi::Env& env) {
            return env.GetInstanceData<NativeSystemAddon>();
        }

        NativeSystemAddon();

        Napi::FunctionReference& clientCtor();
        Napi::FunctionReference& sessionPlayerCtor();

        std::shared_ptr<NativeGlobal> system() const {
            return system_;
        }

    private:
        Napi::FunctionReference clientCtor_;
        Napi::FunctionReference sessionPlayerCtor_;
        const std::shared_ptr<NativeGlobal> system_;
    };

    void VRKitShutdown();
}