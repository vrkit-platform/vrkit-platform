// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include "NativeClient.h"
#include "NativeGlobal.h"
#include "NativeSessionPlayer.h"
#include "NativeSessionDataVariable.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;

namespace {
    auto L = GetCategoryWithName("NativeBootstrap");
}


namespace {
    // Napi::String VRKitPingFn(const Napi::CallbackInfo& info) {
    //     // Napi::Env is the opaque data structure containing the environment in which
    //     // the request is being run. We will need this env when we want to create any
    //     // new objects inside the node.js environment
    //     Napi::Env env = info.Env();
    //
    //     // Return a new javascript string that we copy-construct inside the node.js
    //     // environment
    //     return Napi::String::New(env, "pong");
    // }

    Napi::Value VRKitShutdownFn(const Napi::CallbackInfo& info) {
        VRKitShutdown();
        return {};
    }
}


static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NativeSystemAddon::Init(env, exports);
    NativeClient::Init(env, exports);
    NativeSessionPlayer::Init(env, exports);
    NativeSessionDataVariable::Init(env, exports);

    exports.Set("Shutdown", Napi::Function::New(env, VRKitShutdownFn));
    // exports.Set("VRKitPing", Napi::Function::New(env, VRKitPingFn));
    
    // Napi::String::New(env, "VRKitPing"),
    // Napi::Function::New(env, Ping));
    return exports;
}

NODE_API_MODULE(VRKitSystem, Init)
