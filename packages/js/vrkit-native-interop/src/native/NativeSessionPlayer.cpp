// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include "NativeSessionPlayer.h"

#include <IRacingTools/Shared/DiskSessionDataProvider.h>
#include <IRacingTools/Shared/LiveSessionDataProvider.h>

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;


namespace IRacingTools::App::Node {
    namespace {
        /**
         * @brief The error message used for incorrect constructor calls
         */
        constexpr auto kCtorArgError =
            "SessionPlayer constructor supports the following signature `(onEvent:((...args)=> void), file?: string = null)`";
        auto L = GetCategoryWithType<IRacingTools::App::Node::NativeSessionPlayer>();
    }

    /**
     * @brief
     * @param type of event, must map to `enum VRKitClientEvent` key
     * @param data message to pack into payload
     */
    NativeSessionPlayerJSEvent::NativeSessionPlayerJSEvent(
        RPC::Events::SessionEventType type,
        std::optional<RPC::Events::SessionEventData> data
    ) : type(type), data(data) {
    }

    void NativeSessionPlayer::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(
            env,
            "NativeSessionPlayer",
            {
                InstanceMethod<&NativeSessionPlayer::jsDestroy>("destroy"),
                InstanceMethod<&NativeSessionPlayer::jsStart>("start"),
                InstanceMethod<&NativeSessionPlayer::jsStop>("stop"),
                InstanceMethod<&NativeSessionPlayer::jsResume>("resume"),
                InstanceMethod<&NativeSessionPlayer::jsPause>("pause"),
                InstanceMethod<&NativeSessionPlayer::jsIsPaused>("isPaused"),
                InstanceMethod<&NativeSessionPlayer::jsSeek>("seek"),

                InstanceAccessor<&NativeSessionPlayer::jsIsLive>("isLive"),
                InstanceAccessor<&NativeSessionPlayer::jsGetFileInfo>("fileInfo"),
                InstanceAccessor<&NativeSessionPlayer::jsGetSessionInfo>("sessionInfo"),
                InstanceAccessor<&NativeSessionPlayer::jsGetSessionInfoYAML>("sessionInfoYAML"),
                InstanceAccessor<&NativeSessionPlayer::jsGetSessionData>("sessionData"),
                InstanceAccessor<&NativeSessionPlayer::jsGetSessionTiming>("sessionTiming")
            }
        );

        Constructor(env) = Napi::Persistent(func);
        exports.Set("NativeSessionPlayer", func);
    }

    /**
     * @brief Creates a new session player
     *
     * @param info callback info provided by `node-addon-api`.  Arguments must either be `[string]` or `[]`
     */
    NativeSessionPlayer::NativeSessionPlayer(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<NativeSessionPlayer>(info), system_(NativeGlobal::GetPtr()) {
        L->info("SessionPlayer() new instance: {}", info.Length());

        auto env = info.Env();
        auto argCount = info.Length();
        auto argError = [&](bool errorIf, const std::string& msg) {
            if (errorIf) throw TypeError::New(env, msg);
        };

        argError(!argCount || argCount > 2, kCtorArgError);

        argError(!info[0].IsFunction(), kCtorArgError);
        argError(argCount == 2 && !info[1].IsString(), kCtorArgError);

        // CREATE SESSION STATE
        sessionData_ = std::make_shared<Models::Session::SessionData>();

        if (argCount == 2) {
            // Disk based player
            auto filePathStr = info[1].As<Napi::String>().Utf8Value();

            fs::path filePath{filePathStr};
            argError(
                !GetFileInfo(sessionData_->mutable_file_info(), filePath).has_value(),
                std::format("FileInfo is unavailable: {}", filePathStr)
            );

            dataProvider_ = std::make_shared<DiskSessionDataProvider>(filePath, filePath.string());
            sessionData_ = dataProvider_->sessionData();
        } else {
            // Live player
            dataProvider_ = std::make_shared<LiveSessionDataProvider>();
            sessionData_ = dataProvider_->sessionData();
        }

        auto context = new Reference<Napi::Value>(Persistent(info.This()));

        jsSessionPlayerEventFn_ = SessionPlayerEventFn::New(
            env,
            info[0].As<Function>(),
            "SessionPlayerEvent",
            // Resource name
            0,
            // Unlimited queue
            1,
            // Only one thread will use this initially
            context,
            [](
            Napi::Env,
            NativeSessionPlayerEventFinalizerDataType*,
            // ReSharper disable once CppParameterMayBeConstPtrOrRef
            NativeSessionPlayerEventContextType* ctx
        ) {
                L->info("Finalizing jsDefaultEventFn_");
                delete ctx;
            }
        );
    }

    /**
     * @brief SessionPlayer destructor
     */
    NativeSessionPlayer::~NativeSessionPlayer() {
        destroy();
    }

    /**
     * @brief Remove all resources associated with the client
     */
    void NativeSessionPlayer::destroy() {
        std::scoped_lock lock(destroyMutex_);
        if (destroyed_.exchange(true)) {
            L->warn("SessionPlayer::destroy(): Already destroyed client");
            return;
        }

        L->info("SessionPlayer::destroy()");

        jsSessionPlayerEventFn_.Release();
    }

    /**
     * @brief Finalize, destroy & cleanup any orphaned resources
     * @see SessionPlayer::destroy()
     *
     * @param napi_env
     */
    void NativeSessionPlayer::Finalize(Napi::Env napi_env) {
        destroy();
        ObjectWrap::Finalize(napi_env);
    }

    Napi::Value NativeSessionPlayer::jsGetSessionInfo(const Napi::CallbackInfo& info) {
        return {};
    }

    Napi::Value NativeSessionPlayer::jsGetSessionInfoYAML(const Napi::CallbackInfo& info) {
        auto sessionInfo = dataProvider_->sessionInfo();
        auto sessionInfoYamlNode = YAML::convert<SessionInfo::SessionInfoMessage>::encode(*sessionInfo);
        auto sessionInfoYaml = YAML::Dump(sessionInfoYamlNode);
        return Napi::String::New(info.Env(), sessionInfoYaml);
    }

    /**
     * @brief Get current session data state/instance
     *
     * @param info napi callback info
     * @return Plain JS object from `Models::Session::SessionData`
     */
    Napi::Value NativeSessionPlayer::jsGetSessionData(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        // TODO: THIS WILL NOT PERFORM, REIMPLEMENT WITH `ObjectWrap<SessionInfo>` IF NEEDED
        auto sessionData = dataProvider_->sessionData();
        std::string sessionDataJson{};
        if (auto encodeRes = google::protobuf::json::MessageToJsonString(*sessionData, &sessionDataJson); !encodeRes.
            ok()) {
            throw TypeError::New(env, "Unable to encode `SessionData` to JSON");
        }

        auto sessionDataJsonStr = Napi::String::New(env, sessionDataJson);;
        auto json = env.Global().Get("JSON").As<Object>();
        auto parse = json.Get("parse").As<Function>();
        return parse.Call(json, {sessionDataJsonStr});
    }

    Napi::Value NativeSessionPlayer::jsGetSessionTiming(const Napi::CallbackInfo& info) {
        if (auto data = jsGetSessionData(info); data.IsObject()) return data.As<Napi::Object>().Get("timing");
        return {};
    }

    Napi::Value
    NativeSessionPlayer::jsIsLive(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        return Napi::Boolean::New(env, isLive());
    }

    Napi::Value
    NativeSessionPlayer::jsGetFileInfo(const Napi::CallbackInfo& info) {
        if (auto data = jsGetSessionData(info); data.IsObject()) return data.As<Napi::Object>().Get("fileInfo");
        return {};
    }

    Napi::Value
    NativeSessionPlayer::jsStart(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), dataProvider_->start());
    }

    Napi::Value
    NativeSessionPlayer::jsStop(const Napi::CallbackInfo& info) {
        dataProvider_->stop();
        return Napi::Boolean::New(info.Env(), isLive());
    }

    Napi::Value
    NativeSessionPlayer::jsResume(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), dataProvider_->resume());
    }

    Napi::Value
    NativeSessionPlayer::jsPause(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), dataProvider_->pause());
    }

    Napi::Value
    NativeSessionPlayer::jsIsPaused(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), dataProvider_->isPaused());
    }


    Napi::Value
    NativeSessionPlayer::jsSeek(const Napi::CallbackInfo& info) {
        return {};
    }

    Napi::Value NativeSessionPlayer::jsDestroy(const Napi::CallbackInfo& info) {
        destroy();
        return {};
    }

    // void SessionPlayer::jsDefaultEventCallback(
    void JSSessionPlayerEventCallback(
        Napi::Env env,
        Napi::Function callback,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeSessionPlayerEventContextType* context,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeSessionPlayerEventDataType* data
    ) {
        L->info("JSSessionPlayerEventCallback()");
        L->info("JSSessionPlayerEventCallback() eventType: {}", magic_enum::enum_name(data->type).data());
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
