// https://github.com/electron/electron/blob/9-x-y/patches/node/enable_31_bit_smis_on_64bit_arch_and_ptr_compression.patch
// #define V8_COMPRESS_POINTERS
// #define V8_31BIT_SMIS_ON_64BIT_ARCH
// #define V8_REVERSE_JSARGS
// #define V8_COMPRESS_POINTERS_IN_ISOLATE_CAGE


#include <napi.h>
#include <IRacingTools/Models/rpc/Messages/SimpleMessages.pb.h>
#include "NodeSystemAddon.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;

namespace {
  auto L =  GetCategoryWithType<IRacingTools::App::Node::NodeSystemGlobal>();


}

namespace IRacingTools::App::Node {

  void NodeSystemGlobal::destroy() {
    manager_->destroy();
  }

  NodeSystemGlobal::NodeSystemGlobal(token) : manager_(
      std::make_shared<NodeSystemManager>()) {

    manager_->init();
    manager_->start();

    // Testing only
    auto pingRouteExecutor = [&] (const std::shared_ptr<Messages::Ping> & request,
              const std::shared_ptr<RPC::Envelope> & envelope) -> std::expected<std::shared_ptr<Messages::Pong>, GeneralError> {
      L->info("Processing request path for ping: {}", envelope->request_path());
      auto response = std::make_shared<Messages::Pong>();
      response->set_ping_count(request->count());
      return response;
    };

    auto pingRoute = RPCServerService::TypedRoute<Messages::Ping, Messages::Pong>::Create(pingRouteExecutor, "/ping");

    auto rpcService = serviceManager()->getService<RPCServerService>();
    rpcService->addRoute(pingRoute);
  }

  /**
   * @brief per-context reference to global
   */
  NodeSystemAddon::NodeSystemAddon() : system_(NodeSystemGlobal::GetPtr()) {
  }

  Napi::FunctionReference & NodeSystemAddon::clientCtor() {
    return clientCtor_;
  }

  void NodeSystemClient::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(
          env, "VRKitNativeClient",
          {
              InstanceMethod<&NodeSystemClient::jsExecuteRequest>("executeRequest"),
              // InstanceMethod<&NodeSystemClient::jsShutdown>("shutdown"),
              // InstanceMethod<&NodeSystemClient::jsOpenBucket>("openBucket"),
              // InstanceMethod<&NodeSystemClient::jsDiagnostics>("diagnostics"),
              // InstanceMethod<&NodeSystemClient::jsPing>("ping"),
              // InstanceMethod<&NodeSystemClient::jsScan>("scan"),

          });

      Constructor(env) = Napi::Persistent(func);
      exports.Set("VRKitNativeClient", func);
  }

  NodeSystemClient::NodeSystemClient(const Napi::CallbackInfo &info)
      : Napi::ObjectWrap<NodeSystemClient>(info), system_(NodeSystemGlobal::GetPtr())
  {

  }

  NodeSystemClient::~NodeSystemClient() // NOLINT(*-use-equals-default)
  {
      // TODO: Check global ref count and if 0, shutdown
  }

  Napi::Value NodeSystemClient::jsExecuteRequest(
      const Napi::CallbackInfo &info) {
    auto env = info.Env();

    // TODO: implement as async to avoid blocking
    auto deferred = Napi::Promise::Deferred::New(env);

    auto path = info[0].ToString().Utf8Value();

    auto requestData = info[1].As<Napi::Uint8Array>();
    auto requestEnvelope = std::make_shared<RPC::Envelope>();
    VRK_LOG_AND_FATAL_IF(!requestEnvelope->ParseFromArray(requestData.Data(), requestData.ByteLength()), "failed to parse request envelope: {}", requestData.ByteLength());

    auto server = system_->serviceManager()->getService<RPCServerService>();
    auto responseEnvelope = server->execute(requestEnvelope);
    auto resSize = responseEnvelope->ByteSizeLong();

    auto resTypedArray = Napi::Uint8Array::New(env,resSize);

    VRK_LOG_AND_FATAL_IF(!responseEnvelope->SerializeToArray(resTypedArray.Data(), resTypedArray.ByteLength()), "failed to serialize response envelope: {}", requestData.ByteLength());

    deferred.Resolve(resTypedArray);
    return deferred.Promise();
  }


}

namespace {

  Napi::String PingFn(const Napi::CallbackInfo &info) {
    // Napi::Env is the opaque data structure containing the environment in which
    // the request is being run. We will need this env when we want to create any
    // new objects inside of the node.js environment
    Napi::Env env = info.Env();

    // Return a new javascript string that we copy-construct inside of the node.js
    // environment
    return Napi::String::New(env, "pong");
  }




}


static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  NodeSystemAddon::Init(env, exports);
  NodeSystemClient::Init(env, exports);
  exports.Set("VRKitPing",Napi::Function::New(env, PingFn));
  // Napi::String::New(env, "VRKitPing"),
  // Napi::Function::New(env, Ping));
  return exports;
}

NODE_API_MODULE(VRKitSystem, Init)