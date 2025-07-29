// ReSharper disable once CppParameterMayBeConstPtrOrRef

#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <IRacingSDK/Utils/Singleton.h>
#include <IRacingSDK/VarHolder.h>

#include <VRKit/Models/rpc/Messages/SimpleMessages.pb.h>
#include <VRKit/Models/rpc/Events/CommonEventTypes.pb.h>
#include <VRKit/Models/rpc/Events/SessionEvent.pb.h>

#include <VRKit/Shared/Games/IRacing/SessionDataProvider.h>
#include <VRKit/Shared/Services/TelemetryDataService.h>
#include <VRKit/Shared/Services/TrackMapService.h>

#include <VRKit/Shared/Services/ServiceManager.h>

#include <VRKit/Shared/Logging/LoggingManager.h>

#include <napi.h>

#include "NativeGlobal.h"
using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;
using namespace VRKit::Models;


namespace VRKit::App::Node {
    using namespace Shared::Services;



    class NativeSessionDataVariable : public Napi::ObjectWrap<NativeSessionDataVariable> {
    public:
        static Napi::FunctionReference& Constructor(Napi::Env env) {
            return NativeSystemAddon::fromEnv(env)->sessionDataVariableCtor();
        }

        /**
         * @brief Initialize `node-addon`
         *
         * @param env jsEnv context
         * @param exports to populate with classes & other members
         */
        static void Init(Napi::Env env, Napi::Object exports);

        explicit NativeSessionDataVariable(const Napi::CallbackInfo& info);
        ~NativeSessionDataVariable() override;

        virtual void Finalize(Napi::Env) override;

        void destroy();

        const std::string& varName() const;

    private:
        Napi::Value jsGetName(const Napi::CallbackInfo& info);
        Napi::Value jsGetType(const Napi::CallbackInfo& info);
        Napi::Value jsGetCount(const Napi::CallbackInfo& info);
        Napi::Value jsIsValid(const Napi::CallbackInfo& info);
        Napi::Value jsGetDescription(const Napi::CallbackInfo& info);
        Napi::Value jsGetUnit(const Napi::CallbackInfo& info);

        Napi::Value jsGetBool(const Napi::CallbackInfo& info);
        Napi::Value jsGetChar(const Napi::CallbackInfo& info);
        Napi::Value jsGetBitmask(const Napi::CallbackInfo& info);
        Napi::Value jsGetInt(const Napi::CallbackInfo& info);
        Napi::Value jsGetFloat(const Napi::CallbackInfo& info);
        Napi::Value jsGetDouble(const Napi::CallbackInfo& info);

        Napi::Value jsDestroy(const Napi::CallbackInfo& info);

        std::shared_ptr<Games::IRacing::SessionDataProvider> dataProvider_{nullptr};

        std::unique_ptr<VarHolder> varHolder_{nullptr};

        std::string varName_;


    };


}
