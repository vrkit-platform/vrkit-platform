// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/Shared/FileSystemHelpers.h>

#include "NativeSessionDataVariable.h"
#include "NativeSessionPlayer.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;


namespace IRacingTools::App::Node {
  namespace {
    /**
     * @brief The error message used for incorrect constructor calls
     */
    constexpr auto kCtorArgError =
      "SessionDataVariable constructor accepts a single signature, which must be a valid `new (jsPlayer: NativeSessionPlayer, varName: string)`";
    auto L = GetCategoryWithType<IRacingTools::App::Node::NativeSessionDataVariable>();
  }

  void NativeSessionDataVariable::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(
      env,
      "NativeSessionDataVariable",
      {
        InstanceAccessor<&NativeSessionDataVariable::jsGetName>("name"),
        InstanceAccessor<&NativeSessionDataVariable::jsGetType>("type"),
        InstanceAccessor<&NativeSessionDataVariable::jsGetCount>("count"),
        InstanceAccessor<&NativeSessionDataVariable::jsIsValid>("valid"),
        InstanceAccessor<&NativeSessionDataVariable::jsGetDescription>("description"),
        InstanceAccessor<&NativeSessionDataVariable::jsGetUnit>("unit"),
        InstanceMethod<&NativeSessionDataVariable::jsGetChar>("getChar"),
        InstanceMethod<&NativeSessionDataVariable::jsGetBitmask>("getBitmask"),
        InstanceMethod<&NativeSessionDataVariable::jsGetBool>("getBool"),
        InstanceMethod<&NativeSessionDataVariable::jsGetInt>("getInt"),
        InstanceMethod<&NativeSessionDataVariable::jsGetFloat>("getFloat"),
        InstanceMethod<&NativeSessionDataVariable::jsGetDouble>("getDouble"),
        InstanceMethod<&NativeSessionDataVariable::jsDestroy>("destroy"),
      }
    );

    Constructor(env) = Napi::Persistent(func);
    exports.Set("NativeSessionDataVariable", func);
  }

  /**
   * @brief Creates a new session player
   *
   * @param info callback info provided by `node-addon-api`.  Arguments must either be `[string]` or `[]`
   */
  NativeSessionDataVariable::NativeSessionDataVariable(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<NativeSessionDataVariable>(info) {
    L->info("NativeSessionDataVariable() new instance: {}", info.Length());

    auto env = info.Env();
    auto argCount = info.Length();
    auto argError = [&](bool errorIf, const std::string& msg) {
      if (errorIf) throw TypeError::New(env, msg);
    };

    argError(argCount != 2, kCtorArgError);

    argError(!info[0].IsObject(), kCtorArgError);
    argError(!info[1].IsString(), kCtorArgError);

    // GET `NativeSessionPlayer`
    auto playerJsObj = info[0].As<Napi::Object>();
    if (!playerJsObj.InstanceOf(NativeSessionPlayer::Constructor(env).Value())) {
      throw Napi::Error::New(env, "first parameter must be a Connection object");
    }

    auto player = NativeSessionPlayer::Unwrap(playerJsObj);

    // GET `SessionDataProvider` FROM `NativeSessionPlayer`
    dataProvider_ = player->dataProvider();

    // GET `name`, STRING ARG
    varName_ = info[1].As<Napi::String>().Utf8Value();

    varHolder_ = std::make_unique<VarHolder>(varName_, dataProvider_->clientProvider());
  }

  /**
   * @brief SessionPlayer destructor
   */
  NativeSessionDataVariable::~NativeSessionDataVariable() {
    destroy();
  }

  /**
   * @brief Remove all resources associated with the client
   */
  void NativeSessionDataVariable::destroy() {
    L->info("Cleaning up data provider");
    this->dataProvider_.reset();
    L->info("Cleaned up data provider");
  }

  const std::string& NativeSessionDataVariable::varName() const {
    return varName_;
  }


  /**
   * @brief Finalize, destroy & cleanup any orphaned resources
   * @see SessionPlayer::destroy()
   *
   * @param napi_env
   */
  void NativeSessionDataVariable::Finalize(Napi::Env napi_env) {
    destroy();
    ObjectWrap::Finalize(napi_env);
  }

  Napi::Value
  NativeSessionDataVariable::jsIsValid(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    return Napi::Boolean::New(env, varHolder_->isValid());
  }


  Napi::Value
  NativeSessionDataVariable::jsGetBool(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    int32_t entry = info.Length() != 1 || !info[0].IsNumber() ? 0 : info[0].As<Napi::Number>().Int32Value();

    if (varHolder_->isValid() && varHolder_->getType() == VarDataType::Bool) return Napi::Boolean::New(
      env,
      varHolder_->getBool(entry)
    );

    return {};
  }

  Napi::Value
  NativeSessionDataVariable::jsGetChar(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    int32_t entry = info.Length() != 1 || !info[0].IsNumber() ? 0 : info[0].As<Napi::Number>().Int32Value();

    if (varHolder_->isValid() && varHolder_->getType() == VarDataType::Char) return Napi::Boolean::New(
      env,
      varHolder_->getInt(entry)
    );

    return {};
  }

  Napi::Value
  NativeSessionDataVariable::jsGetBitmask(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    int32_t entry = info.Length() != 1 || !info[0].IsNumber() ? 0 : info[0].As<Napi::Number>().Int32Value();

    if (varHolder_->isValid() && varHolder_->getType() == VarDataType::Bitmask) return Napi::Boolean::New(
      env,
      varHolder_->getInt(entry)
    );

    return {};
  }

  Napi::Value NativeSessionDataVariable::jsGetName(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), varName_);
  }

  Napi::Value NativeSessionDataVariable::jsGetType(const Napi::CallbackInfo& info) {
    return Napi::Number::New(info.Env(), magic_enum::enum_underlying(varHolder_->getType()));
  }

  Napi::Value NativeSessionDataVariable::jsGetCount(const Napi::CallbackInfo& info) {
    return Napi::Number::New(info.Env(), varHolder_->getCount());
  }

  Napi::Value NativeSessionDataVariable::jsGetDescription(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), varHolder_->description());
  }

  Napi::Value NativeSessionDataVariable::jsGetUnit(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), varHolder_->unit());
  }

  Napi::Value NativeSessionDataVariable::jsGetInt(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    int32_t entry = info.Length() != 1 || !info[0].IsNumber() ? 0 : info[0].As<Napi::Number>().Int32Value();

    if (varHolder_->isValid() && varHolder_->getType() == VarDataType::Int32) return Napi::Number::New(
      env,
      varHolder_->getInt(entry)
    );

    return {};
  }

  Napi::Value NativeSessionDataVariable::jsGetFloat(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    int32_t entry = info.Length() != 1 || !info[0].IsNumber() ? 0 : info[0].As<Napi::Number>().Int32Value();

    if (varHolder_->isValid() && varHolder_->getType() == VarDataType::Float) return Napi::Number::New(
      env,
      varHolder_->getFloat(entry)
    );

    return {};
  }

  Napi::Value NativeSessionDataVariable::jsGetDouble(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    int32_t entry = info.Length() != 1 || !info[0].IsNumber() ? 0 : info[0].As<Napi::Number>().Int32Value();

    auto isValid = varHolder_->isValid();
    auto type = varHolder_->getType();
    if (isValid && type == VarDataType::Double) return Napi::Number::New(env, varHolder_->getDouble(entry));

    return {};
  }

  Napi::Value NativeSessionDataVariable::jsDestroy(const Napi::CallbackInfo& info) {
    destroy();
    return {};
  }
}
