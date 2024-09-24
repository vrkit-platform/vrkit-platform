// ReSharper disable once CppParameterMayBeConstPtrOrRef

#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Shared/Graphics/IPCOverlayCanvasRenderer.h>
#include <napi.h>
#include <IRacingTools/Shared/Graphics/ImageDataBuffer.h>

#include "NativeGlobal.h"
using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Models;


namespace IRacingTools::App::Node {
  using namespace Shared::Services;

  /**
   * @brief Holds resources required for each overlay window
   */
  struct NativeOverlayWindowResources : Graphics::BGRAIPCOverlayFrameData {
    std::int32_t windowId;
    std::string overlayId;

    NativeOverlayWindowResources() = delete;

    Napi::Value toNapiObject(Napi::Env env);

    explicit NativeOverlayWindowResources(
        const std::int32_t &windowId,
        const std::string &overlayId,
        const PixelSize& imageSize, const ScreenRect& screenRect = {}, const VRRect& vrRect = {});
  };

  /**
   * @brief Native resource manager for overlay windows
   */
  class NativeOverlayManager : public Napi::ObjectWrap<NativeOverlayManager>, public Graphics::BGRAIPCOverlayFrameProducer {
  public:
    static Napi::FunctionReference &Constructor(Napi::Env env) {
      return NativeSystemAddon::fromEnv(env)->overlayManagerCtor();
    }

    /**
     * @brief Get the # of overlays configured
     *
     * @return # of overlays currently configured
     */
    virtual std::size_t getOverlayCount() override;

    virtual std::shared_ptr<Graphics::IPCOverlayFrameData<Graphics::ImageFormatChannels::RGBA>> getOverlayData(std::size_t idx) override;

    virtual void onOverlayFrameData(OnFrameData fn) override;

    /**
     * @brief Initialize `node-addon`
     *
     * @param env jsEnv context
     * @param exports to populate with classes & other members
     */
    static void Init(Napi::Env env, Napi::Object exports);

    explicit NativeOverlayManager(const Napi::CallbackInfo &info);
    ~NativeOverlayManager() override;

    virtual void Finalize(Napi::Env) override;

    std::shared_ptr<Graphics::BGRAIPCOverlayCanvasRenderer> ipcDxRenderer();

    std::shared_ptr<NativeOverlayWindowResources> getResourceByOverlayId(const std::string& overlayId);
   std::shared_ptr<NativeOverlayWindowResources> getResourceByWindowId(const std::int32_t& windowId);



  private:
    /**
     * @brief Get JS Object with information about the resources
     *   allocated for the specific overlay window id
     *
     * @param info  `getResourceInfoById(overlayIdOrWindowId: number | string):
     * NativeOverlayWindowResourceInfo (object)`
     * @return `Napi::Object` adhering to `NativeOverlayWindowResourceInfo`
     */

    Napi::Value jsGetResourceInfoById(const Napi::CallbackInfo &info);

    /**
     * @brief Get JS Object with information about the resources
     *   allocated for the specific overlay window id
     *
     * @param info  `getResourceInfo(idx: number):
     * NativeOverlayWindowResourceInfo (object)`
     * @return `Napi::Object` adhering to `NativeOverlayWindowResourceInfo`
     */
    Napi::Value jsGetResourceInfo(const Napi::CallbackInfo &info);


    /**
     * @brief Get number of resources currently configured
     *
     * @param info
     * @return
     */
    Napi::Value jsGetResourceCount(const Napi::CallbackInfo &info);

    /**
     * @brief Create or update native resources.  If resources exist for
     *   the provided windowId, then check the size matches.  If size changed
     *   then recreate resources
     *
     * @param info `createOrUpdateResources(overlayId: string, windowId: number,
     * width: number, height: number): NativeOverlayWindowResourceInfo (object)`
     * @return `Napi::Object` adhering to `NativeOverlayWindowResources`
     */
    Napi::Value jsCreateOrUpdateResources(const Napi::CallbackInfo &info);

    /**
     * @brief Release native resources.  If no id argument is provided, then
     * remove all
     *
     * @param info `releaseResources(overlayWindowId?: number)`
     * @return Napi::Void
     */
    Napi::Value jsReleaseResources(const Napi::CallbackInfo &info);

    /**
     * @brief process new frame for display
     *
     * @param info `processFrame(overlayWindowId: number, buf: Uint8Array):
     * void`
     * @return Napi::Void
     */
    Napi::Value jsProcessFrame(const Napi::CallbackInfo &info);

    /**
     * @brief destroy the manager & release all resources
     *
     * @param info `destroy(): void`
     * @return Napi::Void
     */
    Napi::Value jsDestroy(const Napi::CallbackInfo &info);

    void destroy();

    std::mutex onFrameMutex_{};
    std::condition_variable onFrameCondition_{};
    std::recursive_mutex resourcesMutex_{};
    std::mutex destroyMutex_{};

    std::atomic_bool destroyed_{false};

    std::shared_ptr<NativeGlobal> system_;

    std::vector<std::shared_ptr<NativeOverlayWindowResources>> resources_{};

    std::shared_ptr<Graphics::DXResources> dxr_;
    std::shared_ptr<Graphics::BGRAIPCOverlayCanvasRenderer> ipcDxRenderer_;
  };
} // namespace IRacingTools::App::Node
