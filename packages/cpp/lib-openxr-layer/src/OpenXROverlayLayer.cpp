//
// Created by jglanz on 1/28/2024.
//

#define XR_USE_GRAPHICS_API_D3D11
#include <cstdio>
#include <iostream>
#include <utility>


#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/OpenXR/OpenXROverlayLayer.h>
#include <IRacingTools/OpenXR/OpenXRNext.h>

#include <spdlog/spdlog.h>

#include "loader_interfaces.h"

#include <IRacingTools/SDK/Utils/Tracing.h>
#include <IRacingTools/Shared/Graphics/RayIntersectsRect.h>
#include <IRacingTools/Shared/Graphics/Spriting.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <openxr/openxr.h>
#include <openxr/openxr_platform.h>
#include <openxr/openxr_reflection.h>


namespace IRacingTools::OpenXR {
    using namespace std::chrono_literals;
    using namespace IRacingTools::SDK;
    using namespace IRacingTools::Shared;

    namespace {
        auto L = Logging::GetCategoryWithType<OpenXROverlayLayer>();
    
        constexpr XrPosef XR_POSEF_IDENTITY{
            .orientation = {0.0f, 0.0f, 0.0f, 1.0f},
            .position = {0.0f, 0.0f, 0.0f},
        };

        constexpr XrExtent2Df XR_LAYER_DEFAULT_SIZE{
            0.8f, 0.6f
        };
    }

    constexpr std::string_view OpenXRLayerName{"VRKitOpenXRLayer"};

    static_assert(OpenXRLayerName.size() <= XR_MAX_API_LAYER_NAME_SIZE);

    // Don't use a unique_ptr as on process exit, windows doesn't clean these up
    // in a useful order, and Microsoft recommend just leaking resources on
    // thread/process exit
    //
    // In this case, it leads to an infinite hang on ^C
    static OpenXROverlayLayer* gLayerInstance{nullptr};

    static std::shared_ptr<OpenXRNext> gNext;
    static OpenXRRuntimeID gRuntime{};

    static inline std::string_view xrresult_to_string(XrResult code) {
        // xrResultAsString exists, but isn't reliably giving useful results, e.g.
        // it fails on the Meta XR Simulator.
        switch (code) {
#define XR_RESULT_CASE(enum_name, value) \
  case enum_name: \
    return {#enum_name}; \
    XR_LIST_ENUM_XrResult(XR_RESULT_CASE)
#undef XR_RESULT_CASE
        default:
            return {};
        }
    }

    static inline XrResult check_xrresult(
        XrResult code,
        const std::source_location& loc = std::source_location::current()
    ) {
        if (XR_SUCCEEDED(code)) [[likely]] {
            return code;
        }

        // xrResultAsString exists, but isn't reliably giving useful results, e.g.
        // it fails on the Meta XR Simulator.
        const auto codeAsString = xrresult_to_string(code);

        if (codeAsString.empty()) {
            // VRK_LOG_SOURCE_LOCATION_AND_FATAL(
            //   loc, "OpenXR call failed: {}", static_cast<int>(code));
            VRK_LOG_AND_FATAL("OpenXR call failed: {}", static_cast<int>(code));
        }
        else {
            VRK_LOG_AND_FATAL("OpenXR call failed: {} ({})", codeAsString, static_cast<int>(code));
            // VRK_LOG_SOURCE_LOCATION_AND_FATAL(
            //   loc, "OpenXR call failed: {} ({})", codeAsString, static_cast<int>(code));
        }
    }

    void OpenXROverlayLayer::maybeRecenter(const VR::VRRenderConfig& vr, const Pose& hmdPose) {
        if (vr.recenterCount == recenterCount_) {
            return;
        }
        this->recenter(vr, hmdPose);
    }

    void OpenXROverlayLayer::recenter(const VR::VRRenderConfig& vr, const Pose& hmdPose) {
        auto pos = hmdPose.position;
        eyeHeight_ = {pos.y};
        pos.y = 0;
    }


    OpenXROverlayLayer::Pose OpenXROverlayLayer::checkVRKitPose(
        const VR::VRRenderConfig& vr,
        const SHM::SHMOverlayFrameConfig& layer,
        const Pose& hmdPose
    ) {
        if (!eyeHeight_) {
            eyeHeight_ = {hmdPose.position.y};
        }

        return {};
    }
    

    OpenXROverlayLayer::Vector2 OpenXROverlayLayer::getOverlaySize(const SHM::SHMConfig& config, const SHM::SHMOverlayFrameConfig& layer) const {
        // const VR::VRRenderConfig& vrc = config.vr;
        const auto& physicalSize = layer.vr.layout.size;
        const auto virtualWidth = physicalSize.width();
        const auto virtualHeight = physicalSize.height();

        return {virtualWidth, virtualHeight};
    }

    OpenXROverlayLayer::OpenXROverlayLayer(
        XrInstance instance,
        XrSystemId system,
        XrSession session,
        OpenXRRuntimeID runtimeID,
        const std::shared_ptr<OpenXRNext>& next
    )
        : openXR_(next) {
        L->debug("{}", __FUNCTION__);
        VRK_TraceLoggingScope("OpenXRLayer::OpenXRLayer()");

        XrSystemProperties systemProperties{.type = XR_TYPE_SYSTEM_PROPERTIES,};
        check_xrresult(next->xrGetSystemProperties(instance, system, &systemProperties));
        maxLayerCount_ = std::min<std::uint32_t>(MaxViewCount, systemProperties.graphicsProperties.maxLayerCount);

        L->debug("XR system: {}", std::string_view{systemProperties.systemName});
        // 'Max' appears to be a recommendation for the eyebox:
        // - ignoring it for quads appears to be widely compatible, and is common
        //   practice with other tools
        // - the spec for `XrSwapchainCreateInfo` only says I have to respect the
        //   graphics API's limits, not this one
        // - some runtimes (e.g. Steavr) have a *really* small size here that
        //   prevents spriting.
        L->debug(
            "System supports up to {} layers, with a suggested resolution of {}x{}",
            maxLayerCount_,
            systemProperties.graphicsProperties.maxSwapchainImageWidth,
            systemProperties.graphicsProperties.maxSwapchainImageHeight
        );

        renderCacheKeys_.fill(~(0ui64));

        XrReferenceSpaceCreateInfo referenceSpace{
            .type = XR_TYPE_REFERENCE_SPACE_CREATE_INFO,
            .next = nullptr,
            .referenceSpaceType = XR_REFERENCE_SPACE_TYPE_VIEW,//XR_REFERENCE_SPACE_TYPE_LOCAL,
            .poseInReferenceSpace = XR_POSEF_IDENTITY,
        };

        auto oxr = next.get();

        check_xrresult(oxr->xrCreateReferenceSpace(session, &referenceSpace, &localSpace_));

        referenceSpace.referenceSpaceType = XR_REFERENCE_SPACE_TYPE_VIEW;
        check_xrresult(oxr->xrCreateReferenceSpace(session, &referenceSpace, &viewSpace_));

        isVarjoRuntime_ = std::string_view(runtimeID.name).starts_with("Varjo");
        if (isVarjoRuntime_) {
            L->debug("Varjo runtime detected");
        }
    }

    OpenXROverlayLayer::~OpenXROverlayLayer() {
        VRK_TraceLoggingScope("OpenXRLayer::OpenXRLayer()");

        if (localSpace_) {
            openXR_->xrDestroySpace(localSpace_);
        }
        if (viewSpace_) {
            openXR_->xrDestroySpace(viewSpace_);
        }

        if (swapchain_) {
            openXR_->xrDestroySwapchain(swapchain_);
        }
    }

    OpenXRNext* OpenXROverlayLayer::getOpenXR() {
        return openXR_.get();
    }

    XrResult OpenXROverlayLayer::xrEndFrame(XrSession session, const XrFrameEndInfo* frameEndInfo) {
        VRK_TraceLoggingScopedActivity(activity, "OpenXRLayer::xrEndFrame()");
        if (frameEndInfo->layerCount == 0) {
            TraceLoggingWriteTagged(activity, "No game layers.");
            return openXR_->xrEndFrame(session, frameEndInfo);
        }

        const auto shm = this->getSHM();

        if (!(shm && *shm)) {
            TraceLoggingWriteTagged(activity, "No feeder");
            return openXR_->xrEndFrame(session, frameEndInfo);
        }

        auto snapshot = shm->maybeGetMetadata();
        if (!snapshot.hasMetadata()) {
            TraceLoggingWriteTagged(activity, "No metadata");
            return openXR_->xrEndFrame(session, frameEndInfo);
        }

        if (snapshot.getOverlayCount() < 1) {
            TraceLoggingWriteTagged(activity, "No SHM overlays/layers");
            return openXR_->xrEndFrame(session, frameEndInfo);
        }

        const auto swapchainDimensions = Graphics::Spriting::GetBufferSize(snapshot.getOverlayCount());

        if (swapchain_) {
            if ((swapchainDimensions_ != swapchainDimensions) || (sessionID_ != snapshot.getSessionID())) {
                VRK_TraceLoggingScope("DestroySwapchain");
                this->releaseSwapchainResources(swapchain_);
                openXR_->xrDestroySwapchain(swapchain_);
                swapchain_ = {};
            }
        }

        if (!swapchain_) {
            VRK_TraceLoggingScope(
                "CreateSwapchain",
                TraceLoggingValue(swapchainDimensions.width_, "width"),
                TraceLoggingValue(swapchainDimensions.height_, "height")
            );
            swapchain_ = this->createSwapchain(session, swapchainDimensions);
            if (!swapchain_) [[unlikely]] {
                VRK_LOG_AND_FATAL("Failed to create swapchain");
            }
            swapchainDimensions_ = swapchainDimensions;
            sessionID_ = snapshot.getSessionID();
            L->info("Created {}x{} swapchain", swapchainDimensions.width_, swapchainDimensions.height_);
        }

        if (!snapshot.hasTexture()) {
            snapshot = this->getSHM()->maybeGet();

            if (!snapshot.hasTexture()) {
                TraceLoggingWriteTagged(activity, "NoTexture");
                return openXR_->xrEndFrame(session, frameEndInfo);
            }
        }

        const auto hmdPose = this->GetHMDPose(frameEndInfo->displayTime);
        auto vrOverlays = this->getOverlays(snapshot, hmdPose);
        const auto overlayLayerCount = (vrOverlays.size() + frameEndInfo->layerCount) <= maxLayerCount_ ?
                                    vrOverlays.size() :
                                    (maxLayerCount_ - frameEndInfo->layerCount);
        if (overlayLayerCount <= 0) {
            TraceLoggingWriteTagged(activity, "No active layers");
            return openXR_->xrEndFrame(session, frameEndInfo);
        }
        vrOverlays.resize(overlayLayerCount);

        auto config = snapshot.getConfig();
        std::int64_t maxFrameMillis = TimeEpoch().count() - MaxFrameIntervalMillis;

        std::vector<const XrCompositionLayerBaseHeader*> nextLayers;
        nextLayers.reserve(frameEndInfo->layerCount + overlayLayerCount);
        std::copy(
            frameEndInfo->layers,
            &frameEndInfo->layers[frameEndInfo->layerCount],
            std::back_inserter(nextLayers)
        );

        uint8_t topMost = overlayLayerCount - 1;

        bool needRender = config.vr.quirks.alwaysUpdateSwapchain;
        std::vector<SHM::LayerSprite> layerSprites;
        std::vector<uint64_t> cacheKeys;
        std::vector<XrCompositionLayerQuad> addedXRLayers;
        layerSprites.reserve(overlayLayerCount);
        cacheKeys.reserve(overlayLayerCount);
        addedXRLayers.reserve(overlayLayerCount);

        for (size_t overlayIdx = 0; overlayIdx < overlayLayerCount; ++overlayIdx) {
            const auto [layer, params] = vrOverlays.at(overlayIdx);
            if (layer->updatedAt < maxFrameMillis) {
              if (L->should_log(spdlog::level::debug))
                L->debug("Ignoring layer ({}) as it has not been updated in {}ms", overlayIdx, maxFrameMillis - layer->updatedAt);
              continue;
            }
            cacheKeys.push_back(params.cacheKey);
            PixelRect destRect{
                Graphics::Spriting::GetOffset(overlayIdx, snapshot.getOverlayCount()),
                layer->locationOnTexture.size(),
            };
            // using Upscaling = VRConfig::Quirks::Upscaling;
            // switch (config.vr.quirks.openXR_Upscaling) {
            //   case Upscaling::Automatic:
            //     if (!isVarjoRuntime_) {
            //       break;
            //     }
            //     [[fallthrough]];
            //   case Upscaling::AlwaysOn:
            //     destRect.size_ = destRect.size_.ScaledToFit(CLI::Config::MaxViewRenderSize);
            //     break;
            //   case Upscaling::AlwaysOff:
            //     // nothing to do
            //     break;
            // }

            layerSprites.push_back(
                SHM::LayerSprite{
                    .sourceRect = layer->locationOnTexture,
                    .destRect = destRect,
                    .opacity = params.kneeboardOpacity,
                }
            );

            if (params.cacheKey != renderCacheKeys_.at(overlayIdx)) {
                needRender = true;
            }
            // needRender = true;

            static_assert(
                SHM::SHARED_TEXTURE_IS_PREMULTIPLIED,
                "Use premultiplied alpha in shared texture, or pass " "XR_COMPOSITION_LAYER_UNPREMULTIPLIED_ALPHA_BIT"
            );

            XrPosef pose = XR_POSEF_IDENTITY;
            // auto vrPose = layer->vr.pose;
            // if (vrPose.isValid()) {
            //     pose.position = {vrPose.x, vrPose.eyeY, vrPose.z};
            // } else {
            //     pose.position = {-0.25f, 0.0f, -1.0f};
            // }
            // pose.position = {-0.25f, 0.0f, -1.0f};
            auto& layout = layer->vr.layout;
            auto& layerPose = layout.pose;
            auto& layerSize = layout.size;
            pose.position = {layerPose.x, layerPose.eyeY, layerPose.z};
            //L->info("XR Frame Pose idx={},x={}", overlayIdx, pose.position.x);
            //auto pose = GetXrPosef(params.kneeboardPose);
            auto imageRect = destRect.staticCast<int, XrRect2Di>();
            addedXRLayers.push_back(
                {
                    .type = XR_TYPE_COMPOSITION_LAYER_QUAD,
                    .next = nullptr,
                    .layerFlags = XR_COMPOSITION_LAYER_BLEND_TEXTURE_SOURCE_ALPHA_BIT |
                    XR_COMPOSITION_LAYER_CORRECT_CHROMATIC_ABERRATION_BIT,
                    .space = localSpace_,
                    .eyeVisibility = XR_EYE_VISIBILITY_BOTH,
                    .subImage = XrSwapchainSubImage{
                        .swapchain = swapchain_,
                        .imageRect = imageRect,
                        .imageArrayIndex = 0,
                    },
                    .pose = pose,
                    .size = {layerSize.width(),layerSize.height()} // XR_LAYER_DEFAULT_SIZE//{params.kneeboardSize.x, params.kneeboardSize.y},
                }
            );

            nextLayers.push_back(reinterpret_cast<XrCompositionLayerBaseHeader*>(&addedXRLayers.back()));
        }

        if (topMost != overlayLayerCount - 1) {
            std::swap(addedXRLayers.back(), addedXRLayers.at(topMost));
        }

        if (needRender) {
            uint32_t swapchainTextureIndex;
            {
                VRK_TraceLoggingScope("AcquireSwapchainImage");
                check_xrresult(openXR_->xrAcquireSwapchainImage(swapchain_, nullptr, &swapchainTextureIndex));
            }

            {
                VRK_TraceLoggingScope("WaitSwapchainImage");
                XrSwapchainImageWaitInfo waitInfo{
                    .type = XR_TYPE_SWAPCHAIN_IMAGE_WAIT_INFO,
                    .timeout = XR_INFINITE_DURATION,
                };
                check_xrresult(openXR_->xrWaitSwapchainImage(swapchain_, &waitInfo));
            }

            {
                VRK_TraceLoggingScope("RenderLayers()");
                this->renderLayers(swapchain_, swapchainTextureIndex, snapshot, layerSprites);
            }

            {
                VRK_TraceLoggingScope("xrReleaseSwapchainImage()");
                check_xrresult(openXR_->xrReleaseSwapchainImage(swapchain_, nullptr));
            }

            for (size_t i = 0; i < cacheKeys.size(); ++i) {
                renderCacheKeys_[i] = cacheKeys.at(i);
            }
        }

        XrFrameEndInfo nextFrameEndInfo{*frameEndInfo};
        nextFrameEndInfo.layers = nextLayers.data();
        nextFrameEndInfo.layerCount = static_cast<uint32_t>(nextLayers.size());

        XrResult nextResult{};
        {
            VRK_TraceLoggingScope("next_xrEndFrame");
            nextResult = openXR_->xrEndFrame(session, &nextFrameEndInfo);
        }
        if (!XR_SUCCEEDED(nextResult)) [[unlikely]] {
            const auto codeAsString = xrresult_to_string(nextResult);

            if (codeAsString.empty()) {
                L->warn("next_xrEndFrame() failed: {}", static_cast<int>(nextResult));
            }
            else {
                L->warn("next_xrEndFrame() failed: {} ({})", codeAsString, static_cast<int>(nextResult));
            }
        }
        return nextResult;
    }

    OpenXROverlayLayer::Pose OpenXROverlayLayer::GetHMDPose(XrTime displayTime) {
        static Pose sCache{};
        static XrTime sCacheKey{};
        if (displayTime == sCacheKey) {
            return sCache;
        }

        XrSpaceLocation location{.type = XR_TYPE_SPACE_LOCATION};
        if (openXR_->xrLocateSpace(viewSpace_, localSpace_, displayTime, &location) != XR_SUCCESS) {
            return {};
        }

        constexpr auto desiredFlags = XR_SPACE_LOCATION_ORIENTATION_VALID_BIT | XR_SPACE_LOCATION_POSITION_VALID_BIT;
        if ((location.locationFlags & desiredFlags) != desiredFlags) {
            return {};
        }

        const auto& p = location.pose.position;
        const auto& o = location.pose.orientation;
        sCache = {.position = {p.x, p.y, p.z}, .orientation = {o.x, o.y, o.z, o.w},};
        sCacheKey = displayTime;
        return sCache;
    }

    OpenXROverlayLayer::RenderParameters OpenXROverlayLayer::getRenderParameters(
        const SHM::Snapshot& snapshot,
        const SHM::SHMOverlayFrameConfig& ofc,
        const Pose& hmdPose
    ) {
        auto config = snapshot.getConfig();
        // const auto kneeboardPose = this->getKneeboardPose(config.vr, ofc, hmdPose);
        // const auto isLookingAtKneeboard = this->isLookingAtKneeboard(config, ofc, hmdPose, kneeboardPose);

        auto cacheKey = snapshot.getRenderCacheKey();
        cacheKey &= ~static_cast<size_t>(1);


        return {
            .kneeboardPose = {},
            .kneeboardSize = this->getOverlaySize(config, ofc),
            .kneeboardOpacity = ofc.vr.opacity.normal,
            .cacheKey = cacheKey,
            .isLookingAtKneeboard = false,
        };
    }

    XrPosef OpenXROverlayLayer::GetXrPosef(const Pose& pose) {
        const auto& p = pose.position;
        const auto& o = pose.orientation;
        return {.orientation = {o.x, o.y, o.z, o.w}, .position = {p.x, p.y, p.z},};
    }

    std::vector<OpenXROverlayLayer::OverlayFrame> OpenXROverlayLayer::getOverlays(const SHM::Snapshot& snapshot, const Pose& hmdPose) {
        if (!eyeHeight_) {
            eyeHeight_ = {hmdPose.position.y};
        }

        const auto totalLayers = snapshot.getOverlayCount();

        std::vector<OverlayFrame> ret;
        ret.reserve(totalLayers);
        for (uint32_t layerIndex = 0; layerIndex < totalLayers; ++layerIndex) {
            const auto overlayFrameConfig = snapshot.getOverlayFrameConfig(layerIndex);
            if (!overlayFrameConfig->vrEnabled) {
                continue;
            }

            ret.push_back(OverlayFrame{overlayFrameConfig, getRenderParameters(snapshot, *overlayFrameConfig, hmdPose)});
        }

        // const auto config = snapshot.getConfig();
        // if (config.vr.enableGazeInputFocus) {
        //     const auto activeLayerID = config.globalInputLayerId;
        //
        //     for (const auto& [layerConfig, renderParams] : std::ranges::reverse_view(ret)) {
        //         if (renderParams.isLookingAtKneeboard && layerConfig->overlayIdx != activeLayerID) {
        //             // SHM::ActiveConsumers::SetActiveInGameViewID(layerConfig->layerID_);
        //             break;
        //         }
        //     }
        // }

        return ret;
    }


    template <class T>
    static const T* findInXrNextChain(XrStructureType type, const void* next) {
        while (next) {
            auto base = static_cast<const XrBaseInStructure*>(next);
            if (base->type == type) {
                return reinterpret_cast<const T*>(base);
            }
            next = base->next;
        }
        return nullptr;
    }

    /**
     * Entrypoint for an instance
     *
     * @param instance
     * @param createInfo
     * @param session
     * @return
     */
    XrResult xrCreateSession(XrInstance instance, const XrSessionCreateInfo* createInfo, XrSession* session) noexcept {
        XrInstanceProperties instanceProps{XR_TYPE_INSTANCE_PROPERTIES};
        gNext->xrGetInstanceProperties(instance, &instanceProps);
        gRuntime.version = instanceProps.runtimeVersion;
        std::strncpy(gRuntime.name, instanceProps.runtimeName, XR_MAX_RUNTIME_NAME_SIZE);
        L->debug("OpenXR runtime: '{}' v{:#x}", gRuntime.name, gRuntime.version);

        const auto ret = gNext->xrCreateSession(instance, createInfo, session);
        if (XR_FAILED(ret)) {
            L->debug("next xrCreateSession failed: {}", static_cast<int>(ret));
            return ret;
        }

        if (gLayerInstance) {
            L->debug("Already have a kneeboard, refusing to initialize twice");
            return XR_ERROR_INITIALIZATION_FAILED;
        }

        const auto system = createInfo->systemId;

        auto d3d11 = findInXrNextChain<XrGraphicsBindingD3D11KHR>(XR_TYPE_GRAPHICS_BINDING_D3D11_KHR, createInfo->next);
        if (d3d11 && d3d11->device) {
            gLayerInstance = new DX11::OpenXRDX11OverlayLayer(instance, system, *session, gRuntime, gNext, *d3d11);
            return ret;
        }


        L->error("Unsupported graphics API");

        return ret;
    }


    XrResult xrDestroySession(XrSession session) {
        delete gLayerInstance;
        gLayerInstance = nullptr;
        return gNext->xrDestroySession(session);
    }

    XrResult xrDestroyInstance(XrInstance instance) {
        delete gLayerInstance;
        gLayerInstance = nullptr;
        return gNext->xrDestroyInstance(instance);
    }

    /**
     * Invoked at the end of each frame
     *
     * @param session
     * @param frameEndInfo
     * @return
     */
    XrResult xrEndFrame(XrSession session, const XrFrameEndInfo* frameEndInfo) noexcept {
        if (gLayerInstance) {
            return gLayerInstance->xrEndFrame(session, frameEndInfo);
        }
        return gNext->xrEndFrame(session, frameEndInfo);
    }

    XrResult xrGetInstanceProcAddr(XrInstance instance, const char* name_cstr, PFN_xrVoidFunction* function) {
        std::string_view name{name_cstr};

        if (name == "xrCreateSession") {
            *function = reinterpret_cast<PFN_xrVoidFunction>(&xrCreateSession);
            return XR_SUCCESS;
        }
        if (name == "xrDestroySession") {
            *function = reinterpret_cast<PFN_xrVoidFunction>(&xrDestroySession);
            return XR_SUCCESS;
        }
        if (name == "xrDestroyInstance") {
            *function = reinterpret_cast<PFN_xrVoidFunction>(&xrDestroyInstance);
            return XR_SUCCESS;
        }
        if (name == "xrEndFrame") {
            *function = reinterpret_cast<PFN_xrVoidFunction>(&xrEndFrame);
            return XR_SUCCESS;
        }

        if (gNext) {
            return gNext->xrGetInstanceProcAddr(instance, name_cstr, function);
        }

        if (name == "xrEnumerateApiLayerProperties") {
            // No need to do anything here; should be implemented by the runtime
            return XR_SUCCESS;
        }

        L->critical(
            "Unsupported OpenXR call '{}' with instance {:#016x} and no next",
            name,
            reinterpret_cast<uintptr_t>(instance)
        );
        return XR_ERROR_FUNCTION_UNSUPPORTED;
    }

    /**
     * Create new instance
     *
     * @param info
     * @param layerInfo
     * @param instance
     * @return
     */
    XrResult xrCreateApiLayerInstance(
        const XrInstanceCreateInfo* info,
        const XrApiLayerCreateInfo* layerInfo,
        XrInstance* instance
    ) {
        L->info("{}", __FUNCTION__);
        // TODO: check version fields etc in layerInfo
        XrApiLayerCreateInfo nextLayerInfo = *layerInfo;
        nextLayerInfo.nextInfo = layerInfo->nextInfo->next;
        auto nextResult = layerInfo->nextInfo->nextCreateApiLayerInstance(info, &nextLayerInfo, instance);
        if (nextResult != XR_SUCCESS) {
            L->debug("Next failed.");
            return nextResult;
        }

        gNext = std::make_shared<OpenXRNext>(*instance, layerInfo->nextInfo->nextGetInstanceProcAddr);

        L->info("Created API layer instance");

        return XR_SUCCESS;
    }


}

/**
 * > PS:
 * [System.Diagnostics.Tracing.EventSource]::new("OpenKneeboard.OpenXR")
 * a4308f76-39c8-5a50-4ede-32d104a8a78d
 */
TRACELOGGING_DEFINE_PROVIDER(
    gTraceProvider,
    "VRKit.OpenXR",
    (0xa4308f76, 0x39c8, 0x5a50, 0x4e, 0xde, 0x32, 0xd1, 0x04, 0xa8, 0xa7, 0x8d)
);

using namespace IRacingTools::OpenXR;
using namespace IRacingTools::Shared;

BOOL WINAPI DllMain(HINSTANCE hinst, DWORD dwReason, LPVOID reserved) {
    switch (dwReason) {
    case DLL_PROCESS_ATTACH:
        TraceLoggingRegister(gTraceProvider);
        // DPrintSettings::Set({
        //   .prefix = "OpenKneeboard-OpenXR",
        // });
        // L->info(
        //   "{} {}, {}",
        //   __FUNCTION__,
        //   Version::ReleaseName,
        //   IsElevated(GetCurrentProcess()) ? "elevated" : "not elevated");
        L->info("OpenXR Layer Attach {}", __FUNCTION__);
        break;
    case DLL_PROCESS_DETACH:
        TraceLoggingUnregister(gTraceProvider);
        break;
    }
    return TRUE;
}

extern "C" {
XrResult __declspec(dllexport) XRAPI_CALL VRK_xrNegotiateLoaderApiLayerInterface(
    const XrNegotiateLoaderInfo* loaderInfo,
    const char* layerName,
    XrNegotiateApiLayerRequest* apiLayerRequest
) {
    using namespace IRacingTools::OpenXR;
    L->debug("{}", __FUNCTION__);

    if (layerName != OpenXRLayerName) {
        L->info("Layer name mismatch:\n -{}\n +{}", OpenXRLayerName, layerName);
        return XR_ERROR_INITIALIZATION_FAILED;
    }

    // TODO: check version fields etc in loaderInfo

    apiLayerRequest->layerInterfaceVersion = XR_CURRENT_LOADER_API_LAYER_VERSION;
    apiLayerRequest->layerApiVersion = XR_CURRENT_API_VERSION;
    apiLayerRequest->getInstanceProcAddr = &IRacingTools::OpenXR::xrGetInstanceProcAddr;
    apiLayerRequest->createApiLayerInstance = &xrCreateApiLayerInstance;
    return XR_SUCCESS;
}
} // namespace IRacingTools::Shared
