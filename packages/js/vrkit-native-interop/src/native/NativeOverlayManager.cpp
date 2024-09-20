// ReSharper disable once CppParameterMayBeConstPtrOrRef


#include "NativeOverlayManager.h"
#include <IRacingTools/Shared/Logging/LoggingManager.h>

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;


namespace IRacingTools::App::Node {
  namespace {
    /**
     * @brief The error message used for incorrect constructor calls
     */
    constexpr auto kCtorArgError = "NativeOverlayManager constructor supports "
                                   "the following signature `()`";
    auto L = GetCategoryWithType<IRacingTools::App::Node::NativeOverlayManager>();
  } // namespace


  void NativeOverlayWindowResources::resize(const PixelSize &size, bool force) {
    if (!force && size == this->size) {
      return;
    }

    D3D11_TEXTURE2D_DESC desc{
      .Width = static_cast<UINT>(size.width()),
      .Height = static_cast<UINT>(size.height()),
      .MipLevels = 1,
      .ArraySize = 1,
      .Format = SHM::SHARED_TEXTURE_PIXEL_FORMAT,
      .SampleDesc = {1, 0},
      .BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE,
    };

    auto device = dxr->getDXDevice().get();

    check_hresult(device->CreateTexture2D(&desc, nullptr, texture.put()));
    renderTarget = Graphics::RenderTarget::Create(dxr, texture);
  }
  void NativeOverlayWindowResources::render(unsigned char *data, std::size_t dataSize) {
    // TODO: Render RGBA data to `renderTarget`
    D3D11_BOX destRegion;
    destRegion.left = 0;
    destRegion.right = size.width();
    destRegion.top = 0;
    destRegion.bottom = size.height();
    destRegion.front = 0;
    destRegion.back = 1;

    UINT32 rowPitch = 4 * size.width();
    dxr->getDXImmediateContext()->UpdateSubresource(renderTarget->d3dTexture().get(), 0, &destRegion, data, rowPitch, 0);
  }

  Napi::Value NativeOverlayWindowResources::toNapiObject(Napi::Env env) {
    auto o = Napi::Object::New(env);
    o.Set("windowId", Napi::Number::New(env, windowId));
    o.Set("overlayId", Napi::String::New(env, overlayId));

    auto s = Napi::Object::New(env);
    s.Set("width", Napi::Number::New(env, size.width()));
    s.Set("height", Napi::Number::New(env, size.height()));

    o.Set("size", s);

    return o;
  }

  NativeOverlayWindowResources::NativeOverlayWindowResources(
  std::shared_ptr<Graphics::DXResources> dxr,
  const std::int32_t &windowId,
    const std::string &overlayId,
    const PixelSize &size) :
      dxr(dxr),windowId(windowId), overlayId(overlayId), size(size) {
    resize(size, true);
  }

  void NativeOverlayManager::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(
      env,
      "NativeOverlayManager",
      {InstanceMethod<&NativeOverlayManager::jsDestroy>("destroy"),
       InstanceMethod<&NativeOverlayManager::jsGetResourceInfo>("getResourceInfo"),
       InstanceMethod<&NativeOverlayManager::jsGetResourceInfoById>("getResourceInfoById"),
       InstanceMethod<&NativeOverlayManager::jsGetResourceCount>("getResourceCount"),
       InstanceMethod<&NativeOverlayManager::jsCreateOrUpdateResources>("createOrUpdateResources"),
       InstanceMethod<&NativeOverlayManager::jsReleaseResources>("releaseResources"),
       InstanceMethod<&NativeOverlayManager::jsProcessFrame>("processFrame")});

    Constructor(env) = Napi::Persistent(func);
    exports.Set("NativeOverlayManager", func);
  }

  /**
   * @brief Creates a new session player
   *
   * @param info callback info provided by `node-addon-api`.  Arguments must
   * either be `[string]` or `[]`
   */
  NativeOverlayManager::NativeOverlayManager(const Napi::CallbackInfo &info) :
      Napi::ObjectWrap<NativeOverlayManager>(info), system_(NativeGlobal::GetPtr()) {
    L->info("NativeOverlayManager() new instance: {}", info.Length());

    dxr_ = std::make_shared<Graphics::DXResources>();
    ipcDxRenderer_ = Graphics::IPCDXRenderer::Create(dxr_);
  }

  /**
   * @brief NativeOverlayManager destructor
   */
  NativeOverlayManager::~NativeOverlayManager() {
    destroy();
  }

  /**
   * @brief Remove all resources associated with the client
   */
  void NativeOverlayManager::destroy() {
    std::scoped_lock lock(destroyMutex_);
    if (destroyed_.exchange(true)) {
      L->warn("NativeOverlayManager::destroy(): Already destroyed client");
      return;
    }

    L->info("Cleaning up NativeOverlayManager");
    // TODO release all resources
    L->info("Cleaned up NativeOverlayManager");
  }

  /**
   * @brief Finalize, destroy & cleanup any orphaned resources
   * @see NativeOverlayManager::destroy()
   *
   * @param napi_env
   */
  void NativeOverlayManager::Finalize(Napi::Env napi_env) {
    destroy();
    ObjectWrap::Finalize(napi_env);
  }

  std::shared_ptr<Graphics::IPCDXRenderer> NativeOverlayManager::ipcDxRenderer() {
    return ipcDxRenderer_;
  }

  std::shared_ptr<NativeOverlayWindowResources> NativeOverlayManager::getResourceByOverlayId(
    const std::string &overlayId) {
    std::scoped_lock lock(resourcesMutex_);
    auto result = std::ranges::find_if(
      resources_.begin(),
      resources_.end(),
      [&](auto &it) {
        return it->overlayId == overlayId;
      });
    if (result != resources_.end()) {
      return *result;
    }

    return nullptr;
  }

  std::shared_ptr<NativeOverlayWindowResources> NativeOverlayManager::getResourceByWindowId(
    const std::int32_t &windowId) {
    std::scoped_lock lock(resourcesMutex_);
    auto result = std::ranges::find_if(
      resources_.begin(),
      resources_.end(),
      [&](auto &it) {
        return it->windowId == windowId;
      });
    if (result != resources_.end()) {
      return *result;
    }

    return nullptr;
  }


  Napi::Value NativeOverlayManager::jsCreateOrUpdateResources(const Napi::CallbackInfo &info) {
    std::scoped_lock lock(resourcesMutex_);
    auto env = info.Env();
    auto throwInvalidArgs = [&] {
      throw TypeError::New(
        env,
        "invalid arguments `createOrUpdateResources(overlayId: string, windowId: number, width: number, height: number): NativeOverlayWindowResourceInfo`");
    };

    if (info.Length() != 4 || !info[0].IsString() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber()) {
      throwInvalidArgs();
    }

    auto overlayId = info[0].As<Napi::String>().Utf8Value();
    auto windowId = info[1].As<Napi::Number>().Int32Value();
    auto width = info[2].As<Napi::Number>().Int32Value();
    auto height = info[3].As<Napi::Number>().Int32Value();
    PixelSize size{static_cast<const unsigned &>(width), static_cast<const unsigned &>(height)};

    auto resource = getResourceByOverlayId(overlayId);
    if (!resource)
      resource = getResourceByWindowId(windowId);

    if (!resource) {
      resource = std::make_shared<NativeOverlayWindowResources>(dxr_, windowId, overlayId, size);
      resources_.push_back(resource);
    } else {
      resource->resize(size);
    }

    return resource->toNapiObject(env);
  }

  Napi::Value
  NativeOverlayManager::jsGetResourceInfo(const Napi::CallbackInfo &info) {
    std::scoped_lock lock(resourcesMutex_);
    auto env = info.Env();

    std::shared_ptr<NativeOverlayWindowResources> resource{nullptr};
    auto idx = info.Length() == 1 && info[0].IsNumber() ? info[0].As<Napi::Number>().Int32Value() : -1;
    if (idx >= 0 && idx < resources_.size()) {
      resource = resources_[idx];
    } else {
      std::string msg{
        "NativeOverlayManager::jsGetResourceInfo(): invalid "
        "argument, 1 arguments of type number is required"};
      L->warn(msg);
      throw TypeError::New(env, msg);
    }

    if (resource) {
      return resource->toNapiObject(env);
    }
    return env.Null();
  }

  Napi::Value
  NativeOverlayManager::jsGetResourceInfoById(const Napi::CallbackInfo &info) {
    std::scoped_lock lock(resourcesMutex_);
    auto env = info.Env();
    auto hasArg = info.Length() == 1;
    std::shared_ptr<NativeOverlayWindowResources> resource{nullptr};
    if (hasArg && info[0].IsNumber()) {
      resource = getResourceByWindowId(info[0].As<Napi::Number>().Int32Value());
    } else if (hasArg && info[0].IsString()) {
      resource = getResourceByOverlayId(info[0].As<Napi::String>().Utf8Value());
    } else {
      std::string msg{
        "NativeOverlayManager::jsGetResourceInfoById(): invalid argument, 1 "
        "arguments of type string | number is required"};
      L->warn(msg);
      throw TypeError::New(env, msg);
    }

    if (resource) {
      return resource->toNapiObject(env);
    }
    return env.Null();
  }

  Napi::Value
  NativeOverlayManager::jsGetResourceCount(const Napi::CallbackInfo &info) {
    std::scoped_lock lock(resourcesMutex_);
    return Napi::Number::New(info.Env(), resources_.size());
  }

  Napi::Value
  NativeOverlayManager::jsReleaseResources(const Napi::CallbackInfo &info) {
    std::scoped_lock lock(resourcesMutex_);
    auto env = info.Env();
    if (info.Length() == 0) {
      resources_.clear();
    } else {
      std::set<std::int32_t> windowIds{};
      std::set<std::string> overlayIds{};
      for (auto i = 0; i < info.Length(); i++) {
        auto &arg = info[i];
        if (arg.IsNumber()) {
          windowIds.insert(arg.As<Napi::Number>().Int32Value());
        } else if (arg.IsString()) {
          overlayIds.insert(arg.As<Napi::String>().Utf8Value());
        } else {
          std::string msg{
            "NativeOverlayManager::jsReleaseResources(): invalid argument, "
            "0..n arguments of type string | number are allowed"};
          L->warn(msg);
          throw TypeError::New(env, msg);
        }
      }

      std::erase_if(
        resources_,
        [&](auto &resource) {
          return windowIds.contains(resource->windowId) || overlayIds.contains(resource->overlayId);
        });
    }
    return {};
  }

  Napi::Value
  NativeOverlayManager::jsProcessFrame(const Napi::CallbackInfo &info) {
    auto env = info.Env();
    auto throwInvalidArgs = [&] {
      throw TypeError::New(
        env,
        "invalid arguments `processFrame(overlayId: string, buf: Uint8Array): void`");
    };

    if (info.Length() != 2 || !info[0].IsString() || !info[1].IsTypedArray()) {
      throwInvalidArgs();
    }

    auto overlayId = info[0].As<Napi::String>().Utf8Value();
    std::shared_ptr<NativeOverlayWindowResources> resource;
    {
      std::scoped_lock lock(resourcesMutex_);
      resource = getResourceByOverlayId(overlayId);
      if (!resource) {
        throw TypeError::New(
          env,
          std::format("resources not found for overlayId: {}", overlayId));
      }
    }

    auto buf = info[1].As<Napi::Uint8Array>();
    resource->render(buf.Data(), buf.ByteLength());
    ipcDxRenderer_->renderNow(resource->renderTarget);

    return env.Undefined();
  }

  Napi::Value NativeOverlayManager::jsDestroy(const Napi::CallbackInfo &info) {
    destroy();
    return info.Env().Undefined();
  }
} // namespace IRacingTools::App::Node
