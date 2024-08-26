// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include "NativeClient.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;


namespace IRacingTools::App::Node {
    namespace {
        auto L = GetCategoryWithType<IRacingTools::App::Node::NativeClient>();
    }

    /**
     * @brief
     * @param type of event, must map to `enum VRKitClientEvent` key
     * @param data message to pack into payload
     */
    NativeJSDefaultEvent::NativeJSDefaultEvent(
        RPC::Events::ClientEventType type,
        std::optional<google::protobuf::Any> data
    ) : type(type), data(data) {
    }

    void NativeClient::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(
            env,
            "NativeClient",
            {
                InstanceMethod<&NativeClient::jsExecuteRequest>("executeRequest"),
                InstanceMethod<&NativeClient::jsDestroy>("destroy")

#ifdef DEBUG
                ,
                InstanceMethod<&NativeClient::jsTestNativeEventEmit>("testNativeEventEmit")
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

    NativeClient::NativeClient(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<NativeClient>(info), system_(NativeGlobal::GetPtr()) {
        L->info("NativeClient() new instance: {}", info.Length());

        auto env = info.Env();
        if (info.Length() < 1) {
            throw TypeError::New(env, "Expected 1 arguments");
        }

        if (!info[0].IsFunction()) {
            throw TypeError::New(env, "Expected first arg to be function");
        }

        auto context = new Reference<Napi::Value>(Persistent(info.This()));

        jsDefaultEventFn_ = NativeDefaultEventFn::New(
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
            NativeDefaultEventFinalizerDataType*,
            // ReSharper disable once CppParameterMayBeConstPtrOrRef
            NativeDefaultEventContextType* ctx
        ) {
                L->info("Finalizing jsDefaultEventFn_");
                delete ctx;
            }
        );
    }

    /**
     * @brief NativeClient destructor
     */
    NativeClient::~NativeClient() {
        destroy();
    }

    /**
     * @brief Remove all resources associated with the client
     */
    void NativeClient::destroy() {
        std::scoped_lock lock(destroyMutex_);
        if (destroyed_.exchange(true)) {
            L->warn("NativeClient::destroy(): Already destroyed client");
            return;
        }

        L->info("NativeClient::destroy()");

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
     * @see NativeClient::destroy()
     *
     * @param napi_env
     */
    void NativeClient::Finalize(Napi::Env napi_env) {
        destroy();
        ObjectWrap::Finalize(napi_env);
    }

    Napi::Value NativeClient::jsDestroy(const Napi::CallbackInfo& info) {
        destroy();
        return {};
    }

    Napi::Value NativeClient::jsExecuteRequest(const Napi::CallbackInfo& info) {
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
    Napi::Value NativeClient::jsTestNativeEventEmit(const Napi::CallbackInfo& info) {
        L->info("jsTestNativeEventEmit() new instance: {}", info.Length());

        auto env = info.Env();
        if (info.Length() < 1) {
            throw TypeError::New(env, "Expected 1 arguments");
        }

        if (!info[0].IsNumber()) {
            throw TypeError::New(env, "Expected first arg to be a number");
        }

        auto eventTypeInt = info[0].As<Napi::Number>().Int32Value();
        auto eventType = magic_enum::enum_cast<RPC::Events::ClientEventType>(eventTypeInt).value_or(
            Events::CLIENT_EVENT_TYPE_UNKNOWN
        );
        L->info("jsTestNativeEventEmit() eventType: {}", magic_enum::enum_name(eventType).data());

        Events::TestEventData dataMessage{};
        dataMessage.set_message("test emit any payload");
        auto dataAny = google::protobuf::Any{};
        dataAny.PackFrom(dataMessage);

        auto jsEventData = new NativeJSDefaultEvent(eventType, dataAny);

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

    // void NativeClient::jsDefaultEventCallback(
    void JSDefaultEventCallback(
        Napi::Env env,
        Napi::Function callback,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeDefaultEventContextType* context,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeDefaultEventDataType* data
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
