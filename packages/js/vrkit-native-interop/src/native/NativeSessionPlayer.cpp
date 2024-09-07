// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include "Utils/NAPIProtobufHelpers.h"
#include "NativeSessionPlayer.h"
#include "NativeSessionDataVariable.h"

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
        const std::shared_ptr<RPC::Events::SessionEventData>& data
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
                InstanceMethod<&NativeSessionPlayer::jsGetDataVariable>("getDataVariable"),
                InstanceMethod<&NativeSessionPlayer::jsGetDataVariableHeaders>("getDataVariableHeaders"),

                InstanceAccessor<&NativeSessionPlayer::jsGetId>("id"),
                InstanceAccessor<&NativeSessionPlayer::jsIsLive>("isLive"),
                InstanceAccessor<&NativeSessionPlayer::jsIsAvailable>("isAvailable"),
                InstanceAccessor<&NativeSessionPlayer::jsGetFileInfo>("fileInfo"),
                InstanceAccessor<&NativeSessionPlayer::jsGetSessionInfoYAMLStr>("sessionInfoYAMLStr"),
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
        constexpr auto kArgIdxId = 1;
        constexpr auto kArgIdxFile = 2;
        constexpr auto kArgCount = 3;

        L->info("SessionPlayer() new instance: {}", info.Length());

        auto env = info.Env();
        auto argCount = info.Length();
        auto argError = [&](bool errorIf, const std::string& msg) {
            if (errorIf) throw TypeError::New(env, msg);
        };

        argError(!argCount || argCount > kArgCount, kCtorArgError);

        argError(!info[0].IsFunction(), kCtorArgError);
        argError(!info[kArgIdxId].IsString(), kCtorArgError);
        argError(argCount == kArgCount && !info[kArgIdxFile].IsString() && !info[kArgIdxFile].IsNull(), kCtorArgError);

        // CREATE SESSION STATE
        sessionData_ = std::make_shared<Models::Session::SessionData>();

        id_ = info[kArgIdxId].As<Napi::String>().Utf8Value();
        if (argCount == kArgCount && info[kArgIdxFile].IsString()) {
            // Disk based player
            auto filePathStr = info[kArgIdxFile].As<Napi::String>().Utf8Value();

            fs::path filePath{filePathStr};
            argError(
                !GetFileInfo(sessionData_->mutable_file_info(), filePath).has_value(),
                std::format("FileInfo is unavailable: {}", filePathStr)
            );

            dataProvider_ = std::make_shared<DiskSessionDataProvider>(filePath, filePath.filename().string());
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

        dataProvider_->subscribe([&] (auto type, auto data) {
            jsSessionPlayerEventFn_.NonBlockingCall(new NativeSessionPlayerJSEvent(type, data));
                //jsSessionPlayerEventFn_.BlockingCall(new NativeSessionPlayerJSEvent(type, data));
        });
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

        L->info("Cleaning up data provider");
        this->dataProvider_->stop();
        this->dataProvider_.reset();

        L->info("Cleaned up data provider");

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

    std::shared_ptr<SessionDataProvider> NativeSessionPlayer::dataProvider() {
        return dataProvider_;
    }

    Napi::Value NativeSessionPlayer::jsGetId(const Napi::CallbackInfo& info) {
        return Napi::String::New(info.Env(), id_);
    }
    Napi::Value NativeSessionPlayer::jsGetDataVariable(const Napi::CallbackInfo& info) {
        // TODO: Create new `Napi::Object` using defined class `NativeSessionDataVariable`
        auto env = info.Env();

        if (info.Length() != 1)
            throw Napi::TypeError::New(env, "A single string parameter is required to get a session data variable");

        auto varName = info[0].As<Napi::String>();

        return NativeSessionDataVariable::Constructor(env).New({info.This(), varName});;
    }

    Napi::Value NativeSessionPlayer::jsGetDataVariableHeaders(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        auto nativeHeaders = dataProvider_->getDataVariableHeaders();

        auto headersObj = Napi::Array::New(env);
        auto headersObjPush = headersObj.Get("push").As<Function>();

        for (auto& nativeHeader : nativeHeaders) {
            auto obj = Napi::Object::New(env);

            // TODO: Map headers ^ to `Napi::Object`
            obj.Set("name", nativeHeader.name);
            obj.Set("desc", nativeHeader.desc);
            obj.Set("unit", nativeHeader.unit);
            obj.Set("type", magic_enum::enum_underlying(nativeHeader.type));
            obj.Set("offset", nativeHeader.offset);
            obj.Set("count", nativeHeader.count);
            obj.Set("countAsTime", nativeHeader.countAsTime);

            headersObjPush.Call(headersObj, {obj});
        }

        return headersObj;
    }


    Napi::Value NativeSessionPlayer::jsGetSessionInfoYAMLStr(const Napi::CallbackInfo& info) {
        // TODO: Change implementation to use raw string from shared memory via `Client` implementations
        auto sessionInfoYaml = dataProvider_->sessionInfoStr();
        // auto sessionInfo = dataProvider_->sessionInfo();
        // auto sessionInfoYamlNode = YAML::convert<SessionInfo::SessionInfoMessage>::encode(*sessionInfo);
        // auto sessionInfoYaml = YAML::Dump(sessionInfoYamlNode);
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
        auto encodeRes = google::protobuf::json::MessageToJsonString(*sessionData, &sessionDataJson);
        if (!encodeRes.ok()) {
            auto errCodeName = std::string{magic_enum::enum_name(encodeRes.code()).data()};
            auto errMessage = std::string{encodeRes.message()};
            L->error("Unable to encode SessionData ({}): {}", errCodeName, errMessage);
            auto terrObj = TypeError::New(env, "Unable to encode `SessionData` to JSON");

            auto errObj = Napi::Object::New(env);
            errObj.Set("code", errCodeName);
            errObj.Set("message", errMessage);
            terrObj.Set("pb", errObj);
            throw terrObj;
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

    Napi::Value NativeSessionPlayer::jsIsAvailable(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), dataProvider_->isAvailable());
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
        return Napi::Boolean::New(info.Env(), true);
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

    void JSSessionPlayerEventCallback(
        Napi::Env env,
        Napi::Function callback,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeSessionPlayerEventContextType* context,
        // ReSharper disable once CppParameterMayBeConstPtrOrRef
        NativeSessionPlayerEventDataType* data
    ) {
        if (L->should_log(spdlog::level::trace))
            L->trace("JSSessionPlayerEventCallback() eventType: {}", std::string(magic_enum::enum_name(data->type)));


        if (!env || !callback) {
            L->warn("JS env AND/OR callback is nullptr");
        } else {
            L->trace("Creating JS object");
            auto jsObj = Napi::Object::New(env);
            jsObj.Set("type", Napi::Number::New(env, data->type));
            if (data->data) {
                jsObj.Set("payload", Utils::MessageToUint8Array(env, data->data.get()));
            } else {
                jsObj.Set("payload", Napi::Value{});
            }

            L->trace("Calling callback");
            callback.Call(
                {Napi::Number::New(env, data->type), jsObj}
            );
        }

        delete data;
    }
}
