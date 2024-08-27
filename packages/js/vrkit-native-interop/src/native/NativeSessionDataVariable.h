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
        Napi::Value jsGetInt(const Napi::CallbackInfo& info);
        Napi::Value jsGetFloat(const Napi::CallbackInfo& info);
        Napi::Value jsGetDouble(const Napi::CallbackInfo& info);

        Napi::Value jsDestroy(const Napi::CallbackInfo& info);

        std::shared_ptr<SessionDataProvider> dataProvider_{nullptr};

        std::unique_ptr<VarHolder> varHolder_{nullptr};

        std::string varName_;


    };


}
