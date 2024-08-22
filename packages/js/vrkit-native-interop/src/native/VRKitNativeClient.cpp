// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/Models/rpc/Messages/SimpleMessages.pb.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include "VRKitNativeClient.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;

namespace {
  auto L = GetCategoryWithType<IRacingTools::App::Node::VRKitNativeGlobal>();

}

namespace IRacingTools::App::Node {


  void VRKitNativeGlobal::destroy() {
    manager_->destroy();
  }

  VRKitNativeGlobal::VRKitNativeGlobal(token) : manager_(
      std::make_shared<VRKitNativeSystemManager>()) {

    manager_->init();
    manager_->start();

    // Testing only
    auto pingRouteExecutor = [&](
        const std::shared_ptr<Messages::Ping> &request,
        const std::shared_ptr<RPC::Envelope> &envelope) -> std::expected<
      std::shared_ptr<Messages::Pong>, GeneralError> {
      L->info("Processing request path for ping: {}", envelope->request_path());
      auto response = std::make_shared<Messages::Pong>();
      response->set_ping_count(request->count());
      return response;
    };

    auto pingRoute = RPCServerService::TypedRoute<
      Messages::Ping, Messages::Pong>::Create(pingRouteExecutor, "/ping");

    auto rpcService = serviceManager()->getService<RPCServerService>();
    rpcService->addRoute(pingRoute);
  }

  /**
   * @brief per-context reference to global
   */
  VRKitNativeSystemAddon::VRKitNativeSystemAddon() : system_(
      VRKitNativeGlobal::GetPtr()) {
  }

  Napi::FunctionReference &VRKitNativeSystemAddon::clientCtor() {
    return clientCtor_;
  }

  VRKitNativeClient::JSDefaultEvent::JSDefaultEvent(
      const std::string &type,
      std::optional<google::protobuf::Any> data) : type(type), data(data) {

  }

  void VRKitNativeClient::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(
        env,
        "VRKitNativeClient",
        {
            InstanceMethod<&VRKitNativeClient::jsExecuteRequest>(
                "executeRequest")
            #ifdef DEBUG
            , InstanceMethod<&VRKitNativeClient::jsTestNativeEventEmit>(
                "testNativeEventEmit")
            #endif
            // InstanceMethod<&NodeSystemClient::jsShutdown>("shutdown"),
            // InstanceMethod<&NodeSystemClient::jsOpenBucket>("openBucket"),
            // InstanceMethod<&NodeSystemClient::jsDiagnostics>("diagnostics"),
            // InstanceMethod<&NodeSystemClient::jsPing>("ping"),
            // InstanceMethod<&NodeSystemClient::jsScan>("scan"),

        });

    Constructor(env) = Napi::Persistent(func);
    exports.Set("VRKitNativeClient", func);
  }

  VRKitNativeClient::VRKitNativeClient(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<VRKitNativeClient>(info),
      system_(VRKitNativeGlobal::GetPtr()) {

    L->info("VRKitNativeClient() new instance");

    auto env = info.Env();
    if (info.Length() < 1) {
      throw TypeError::New(env, "Expected 1 arguments");
    }

    if (!info[0].IsFunction()) {
      throw TypeError::New(env, "Expected first arg to be function");
    }

    auto context = new Reference<Napi::Value>(Persistent(info.This()));

    jsDefaultEventFn_ = DefaultEventFn::New(
        env,
        info[0].As<Function>(),
        // JavaScript function called asynchronously
        "Resource Name",
        // Name
        0,
        // Unlimited queue
        1,
        // Only one thread will use this initially
        context,
        [this](
        Napi::Env,
        DefaultEventFinalizerDataType *,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        DefaultEventContextType *ctx) {
          // Finalizer used to clean threads up
          L->info("Finalizing jsDefaultEventFn_");
          delete ctx;
        });

  }

  VRKitNativeClient::~VRKitNativeClient() // NOLINT(*-use-equals-default)
  {
    // TODO: Check global ref count and if 0, shutdown
    jsDefaultEventFn_.Release();
  }

  Napi::Value VRKitNativeClient::jsExecuteRequest(
      const Napi::CallbackInfo &info) {
    auto env = info.Env();

    // TODO: implement as async to avoid blocking
    auto deferred = Napi::Promise::Deferred::New(env);

    auto path = info[0].ToString().Utf8Value();

    auto requestData = info[1].As<Napi::Uint8Array>();
    auto requestEnvelope = std::make_shared<RPC::Envelope>();
    VRK_LOG_AND_FATAL_IF(
        !requestEnvelope->ParseFromArray(requestData.Data(), requestData.
          ByteLength()),
        "failed to parse request envelope: {}",
        requestData.ByteLength());

    auto server = system_->serviceManager()->getService<RPCServerService>();
    auto responseEnvelope = server->execute(requestEnvelope);
    auto resSize = responseEnvelope->ByteSizeLong();

    auto resTypedArray = Napi::Uint8Array::New(env, resSize);

    VRK_LOG_AND_FATAL_IF(
        !responseEnvelope->SerializeToArray(resTypedArray.Data(), resTypedArray.
          ByteLength()),
        "failed to serialize response envelope: {}",
        requestData.ByteLength());

    deferred.Resolve(resTypedArray);
    return deferred.Promise();
  }

  Napi::Value VRKitNativeClient::jsTestNativeEventEmit(
      const Napi::CallbackInfo &info) {
    L->info("jsTestNativeEventEmit() new instance");

    auto env = info.Env();
    if (info.Length() < 1) {
      throw TypeError::New(env, "Expected 1 arguments");
    }

    if (!info[0].IsString()) {
      throw TypeError::New(env, "Expected first arg to be a string");
    }

    auto eventType = info[0].As<Napi::String>().Utf8Value();

    std::thread jsTestThread(
        [&] {
          L->info("jsTestNativeEventEmit() test thread");

          auto jsEventData = new JSDefaultEvent(eventType);

          napi_status status = jsDefaultEventFn_.NonBlockingCall(jsEventData);;
          if (status != napi_ok) {
            L->error(
                "jsTestNativeEventEmitFn_.NonBlockingCall failed: {}",
                magic_enum::enum_name<napi_status>(status).data());
          } else {
            L->info(
                "jsTestNativeEventEmitFn_.NonBlockingCall succeeded: {}",
                eventType);
          }
        });

    jsTestThread.join();
    return Boolean::New(env, true);


    return {};
  }

  void VRKitNativeClient::jsDefaultEventCallback(
      Napi::Env env,
      Napi::Function callback,
      // ReSharper disable once CppParameterMayBeConstPtrOrRef
      DefaultEventContextType *context,
      // ReSharper disable once CppParameterMayBeConstPtrOrRef
      DefaultEventDataType *data) {

    // Is the JavaScript environment still available to call into, eg. the TSFN is
    // not aborted
    if (!env || !callback) {
      L->error("JS env AND/OR callback is nullptr");

    } else {
      // On Node-API 5+, the `callback` parameter is optional; however, this example
      // does ensure a callback is provided.

      auto jsObj = Napi::Object::New(env);
      jsObj.Set("type", Napi::String::New(env, data->type));
      if (data->data.has_value()) {
        auto &payload = data->data.value();
        auto payloadSize = payload.ByteSizeLong();
        auto payloadTypedArray = Napi::Uint8Array::New(env, payloadSize);
        jsObj.Set("payload", payloadTypedArray);
      } else {
        jsObj.Set("payload", nullptr);
      }

      callback.Call(
          context->Value(),
          {Napi::String::New(env, data->type), jsObj});

    }

    delete data;

  }


}

namespace {

  Napi::String PingFn(const Napi::CallbackInfo &info) {
    // Napi::Env is the opaque data structure containing the environment in which
    // the request is being run. We will need this env when we want to create any
    // new objects inside the node.js environment
    Napi::Env env = info.Env();

    // Return a new javascript string that we copy-construct inside the node.js
    // environment
    return Napi::String::New(env, "pong");
  }


}


static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  VRKitNativeSystemAddon::Init(env, exports);
  VRKitNativeClient::Init(env, exports);
  exports.Set("VRKitPing", Napi::Function::New(env, PingFn));
  // Napi::String::New(env, "VRKitPing"),
  // Napi::Function::New(env, Ping));
  return exports;
}

NODE_API_MODULE(VRKitSystem, Init)