// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include "VRKitNativeClient.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;


namespace IRacingTools::App::Node {
    namespace {
        auto L = GetCategoryWithType<IRacingTools::App::Node::VRKitNativeGlobal>();
    }

    void VRKitNativeGlobal::destroy() {
        manager_->destroy();
    }

    VRKitNativeGlobal::VRKitNativeGlobal(token) : manager_(std::make_shared<VRKitNativeSystemManager>()) {
        manager_->init();
        manager_->start();
#if 0
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
#endif
    }

    void VRKitShutdown() {
        L->info("Shutting down VRKitNativeGlobal");
        VRKitNativeGlobal::GetPtr()->destroy();
        L->info("Shutdown completed VRKitNativeGlobal");
    }

    /**
     * @brief per-context reference to global
     */
    VRKitNativeSystemAddon::VRKitNativeSystemAddon() : system_(VRKitNativeGlobal::GetPtr()) {
    }

    Napi::FunctionReference& VRKitNativeSystemAddon::clientCtor() {
        return clientCtor_;
    }

    /**
     * @brief
     * @param type of event, must map to `enum VRKitClientEvent` key
     * @param data message to pack into payload
     */
    VRKitNativeJSDefaultEvent::VRKitNativeJSDefaultEvent(
        RPC::Events::ClientEvent type,
        std::optional<google::protobuf::Any> data
    ) : type(type), data(data) {
    }

    void VRKitNativeClient::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(
            env,
            "NativeClient",
            {
                InstanceMethod<&VRKitNativeClient::jsExecuteRequest>("executeRequest"),
                InstanceMethod<&VRKitNativeClient::jsDestroy>("destroy")

#ifdef DEBUG
                ,
                InstanceMethod<&VRKitNativeClient::jsTestNativeEventEmit>("testNativeEventEmit")
#endif
                // InstanceMethod<&NodeSystemClient::jsShutdown>("shutdown"),
                // InstanceMethod<&NodeSystemClient::jsOpenBucket>("openBucket"),
                // InstanceMethod<&NodeSystemClient::jsDiagnostics>("diagnostics"),
                // InstanceMethod<&NodeSystemClient::jsPing>("ping"),
                // InstanceMethod<&NodeSystemClient::jsScan>("scan"),

            }
        );

        Constructor(env) = Napi::Persistent(func);
        exports.Set("NativeClient", func);
    }

    VRKitNativeClient::VRKitNativeClient(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<VRKitNativeClient>(info), system_(VRKitNativeGlobal::GetPtr()) {
        L->info("VRKitNativeClient() new instance: {}", info.Length());

        auto env = info.Env();
        if (info.Length() < 1) {
            throw TypeError::New(env, "Expected 1 arguments");
        }

        if (!info[0].IsFunction()) {
            throw TypeError::New(env, "Expected first arg to be function");
        }

        auto context = new Reference<Napi::Value>(Persistent(info.This()));

        jsDefaultEventFn_ = VRKitNativeDefaultEventFn::New(
            env,
            info[0].As<Function>(),
            "VRKNativeDefaultEvent",
            // Resource name
            0,
            // Unlimited queue
            1,
            // Only one thread will use this initially
            context,
            [](
            Napi::Env,
            VRKitNativeDefaultEventFinalizerDataType*,
            // ReSharper disable once CppParameterMayBeConstPtrOrRef
            VRKitNativeDefaultEventContextType* ctx
        ) {
                L->info("Finalizing jsDefaultEventFn_");
                delete ctx;
            }
        );
    }

    /**
     * @brief VRKitNativeClient destructor
     */
    VRKitNativeClient::~VRKitNativeClient() {
        destroy();
    }

    /**
     * @brief Remove all resources associated with the client
     */
    void VRKitNativeClient::destroy() {
        std::scoped_lock lock(destroyMutex_);
        if (destroyed_.exchange(true)) {
            L->warn("VRKitNativeClient::destroy(): Already destroyed client");
            return;
        }

        L->info("VRKitNativeClient::destroy()");

#ifdef DEBUG
        {
            std::scoped_lock jsTestLock(jsTestThreadsMutex_);
            for (auto& it : jsTestThreads_) {
                if (it->joinable()) it->join();
            }
        }

#endif
        jsDefaultEventFn_.Release();
    }

    /**
     * @brief Finalize, destroy & cleanup any orphaned resources
     * @see VRKitNativeClient::destroy()
     *
     * @param napi_env
     */
    void VRKitNativeClient::Finalize(Napi::Env napi_env) {
        destroy();
        ObjectWrap::Finalize(napi_env);
    }

    Napi::Value VRKitNativeClient::jsDestroy(const Napi::CallbackInfo& info) {
        destroy();
        return {};
    }

    Napi::Value VRKitNativeClient::jsExecuteRequest(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        // TODO: implement as async to avoid blocking
        auto deferred = Napi::Promise::Deferred::New(env);

        auto path = info[0].ToString().Utf8Value();

        auto requestData = info[1].As<Napi::Uint8Array>();
        auto requestEnvelope = std::make_shared<RPC::Envelope>();
        VRK_LOG_AND_FATAL_IF(
            !requestEnvelope->ParseFromArray(requestData.Data(), requestData. ByteLength()),
            "failed to parse request envelope: {}",
            requestData.ByteLength()
        );

        auto server = system_->serviceManager()->getService<RPCServerService>();
        auto responseEnvelope = server->execute(requestEnvelope);
        auto resSize = responseEnvelope->ByteSizeLong();

        auto resTypedArray = Napi::Uint8Array::New(env, resSize);

        VRK_LOG_AND_FATAL_IF(
            !responseEnvelope->SerializeToArray(resTypedArray.Data(), resTypedArray. ByteLength()),
            "failed to serialize response envelope: {}",
            requestData.ByteLength()
        );

        deferred.Resolve(resTypedArray);
        return deferred.Promise();
    }
#ifdef DEBUG
    Napi::Value VRKitNativeClient::jsTestNativeEventEmit(const Napi::CallbackInfo& info) {
        L->info("jsTestNativeEventEmit() new instance: {}", info.Length());

        auto env = info.Env();
        if (info.Length() < 1) {
            throw TypeError::New(env, "Expected 1 arguments");
        }

        if (!info[0].IsNumber()) {
            throw TypeError::New(env, "Expected first arg to be a number");
        }

        auto eventTypeInt = info[0].As<Napi::Number>().Int32Value();
        auto eventType = magic_enum::enum_cast<RPC::Events::ClientEvent>(eventTypeInt).value_or(
            Events::CLIENT_EVENT_UNKNOWN
        );
        L->info("jsTestNativeEventEmit() eventType: {}", magic_enum::enum_name(eventType).data());

        Events::ClientEventTestData dataMessage{};
        dataMessage.set_message("test emit any payload");
        auto dataAny = google::protobuf::Any{};
        dataAny.PackFrom(dataMessage);

        auto jsEventData = new VRKitNativeJSDefaultEvent(eventType, dataAny);

        {
            std::scoped_lock lock(jsTestThreadsMutex_);
            jsTestThreads_.push_back(
                std::make_shared<std::thread>(
                    [this, jsEventData] {
                        L->info("jsTestNativeEventEmit() test thread");


                        napi_status status = jsDefaultEventFn_.BlockingCall(jsEventData);
                        if (status != napi_ok) {
                            L->error(
                                "jsTestNativeEventEmitFn_.NonBlockingCall failed: {}",
                                magic_enum::enum_name<napi_status>(status).data()
                            );
                        } else {
                            L->info("jsTestNativeEventEmitFn_.BlockingCall succeeded: {}", magic_enum::enum_name(jsEventData->type).data());
                        }
                    }
                )
            );
        }

        return Boolean::New(env, true);
    }
#endif

    // void VRKitNativeClient::jsDefaultEventCallback(
    void JSDefaultEventCallback(
        Napi::Env env,
        Napi::Function callback,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        VRKitNativeDefaultEventContextType* context,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        VRKitNativeDefaultEventDataType* data
    ) {
        L->info("JSDefaultEventCallback()");
        L->info("JSDefaultEventCallback() eventType: {}", magic_enum::enum_name(data->type).data());
        // Is the JavaScript environment still available to call into, eg. the TSFN is
        // not aborted
        if (!env || !callback) {
            L->error("JS env AND/OR callback is nullptr");
        } else {
            // On Node-API 5+, the `callback` parameter is optional; however, this example
            // does ensure a callback is provided.
            L->info("Creating JS object");
            auto jsObj = Napi::Object::New(env);
            jsObj.Set("type", Napi::Number::New(env, static_cast<int>(data->type)));
            if (data->data.has_value()) {
                auto& dataAny = data->data.value();

                auto dataAnySize = dataAny.ByteSizeLong();
                auto payloadTypedArray = Napi::Uint8Array::New(env, dataAnySize);
                dataAny.SerializeToArray(payloadTypedArray.Data(), dataAnySize);
                jsObj.Set("payload", payloadTypedArray);
            } else {
                jsObj.Set("payload", Napi::Value{});
            }

            L->info("Calling callback");
            callback.Call(
                // context->Value(),
                {Napi::Number::New(env, static_cast<int>(data->type)), jsObj}
            ); //,
        }

        delete data;
    }
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
    VRKitNativeSystemAddon::Init(env, exports);
    VRKitNativeClient::Init(env, exports);
    // exports.Set("VRKitPing", Napi::Function::New(env, VRKitPingFn));
    exports.Set("Shutdown", Napi::Function::New(env, VRKitShutdownFn));
    // Napi::String::New(env, "VRKitPing"),
    // Napi::Function::New(env, Ping));
    return exports;
}

NODE_API_MODULE(VRKitSystem, Init)
