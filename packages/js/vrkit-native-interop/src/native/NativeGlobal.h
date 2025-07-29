// ReSharper disable once CppParameterMayBeConstPtrOrRef

#pragma once

#include <napi.h>
#include <IRacingSDK/Utils/Singleton.h>

#include <VRKit/Shared/SharedAppLibPCH.h>
#include <VRKit/Shared/Services/TelemetryDataService.h>
#include <VRKit/Shared/Services/ServiceManager.h>


#include <VRKit/Shared/Games/IRacing/IRacingIPCServer.h>

using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;
using namespace VRKit::Models;

namespace VRKit::App::Node {
    using namespace Shared::Services;

    /**
     * @brief Global (cross-thread) system manager/holder
     */
    class NativeGlobal : public Singleton<NativeGlobal> {
    public:
        NativeGlobal() = delete;
        NativeGlobal(const NativeGlobal&) = delete;
        NativeGlobal(NativeGlobal&&) = delete;

        void destroy();

        // NativeSystemManagerPtr serviceManager() const {
        //     return manager_;
        // }

    private:
        friend Singleton;
        explicit NativeGlobal(token);

        // const NativeSystemManagerPtr manager_;
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
        Napi::FunctionReference& sessionDataVariableCtor();
        Napi::FunctionReference& overlayManagerCtor();

        std::shared_ptr<NativeGlobal> system() const {
            return system_;
        }

    private:
        Napi::FunctionReference clientCtor_;
        Napi::FunctionReference sessionPlayerCtor_;
        Napi::FunctionReference sessionDataVariableCtor_;
        Napi::FunctionReference overlayManagerCtor_;

        const std::shared_ptr<NativeGlobal> system_;
    };

    void VRKitShutdown();
}