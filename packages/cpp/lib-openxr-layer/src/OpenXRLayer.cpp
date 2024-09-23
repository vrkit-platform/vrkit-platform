//
// Created by jglanz on 1/28/2024.
//

#define XR_USE_GRAPHICS_API_D3D11
#include <cstdio>
#include <iostream>
#include <utility>


#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/OpenXR/OpenXRLayer.h>
#include <IRacingTools/OpenXR/OpenXRNext.h>

#include <spdlog/spdlog.h>

#include "loader_interfaces.h"

#include <IRacingTools/SDK/Utils/Tracing.h>
#include <IRacingTools/Shared/Graphics/RayIntersectsRect.h>
#include <IRacingTools/Shared/Graphics/Spriting.h>
#include <openxr/openxr.h>
#include <openxr/openxr_platform.h>
#include <openxr/openxr_reflection.h>


namespace IRacingTools::OpenXR {
    using namespace std::chrono_literals;
    using namespace IRacingTools::SDK;
    using namespace IRacingTools::Shared;

    // constexpr XrPosef Default2DPose = {{0, 0, 0, 1}, {0, 0, 0}};
    static constexpr XrPosef XR_POSEF_IDENTITY{
        .orientation = {0.0f, 0.0f, 0.0f, 1.0f},
        .position = {0.0f, 0.0f, 0.0f},
    };

    static constexpr XrExtent2Df XR_LAYER_DEFAULT_SIZE{
        0.8f, 0.6f
    };

    // constexpr std::string_view OpenXRLayerName{"IRTOpenXRLayer"};
    constexpr std::string_view OpenXRLayerName{"VRKitOpenXRLayer"};

    static_assert(OpenXRLayerName.size() <= XR_MAX_API_LAYER_NAME_SIZE);

    // Don't use a unique_ptr as on process exit, windows doesn't clean these up
    // in a useful order, and Microsoft recommend just leaking resources on
    // thread/process exit
    //
    // In this case, it leads to an infinite hang on ^C
    static OpenXRLayer* gLayerInstance{nullptr};

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

    void OpenXRLayer::maybeRecenter(const VR::VRRenderConfig& vr, const Pose& hmdPose) {
        if (vr.recenterCount == recenterCount_) {
            return;
        }
        this->recenter(vr, hmdPose);
    }

    void OpenXRLayer::recenter(const VR::VRRenderConfig& vr, const Pose& hmdPose) {
        auto pos = hmdPose.position;
        eyeHeight_ = {pos.y};
        pos.y = 0;

        // We're only going to respect ry (yaw) as we want the new
        // center to remain gravity-aligned

        auto quat = hmdPose.orientation;

        // clang-format off
        recenter_ = Matrix::CreateRotationY(quat.ToEuler().y) * Matrix::CreateTranslation({pos.x, pos.y, pos.z});
        // clang-format on

        recenterCount_ = vr.recenterCount;
    }


    OpenXRLayer::Pose OpenXRLayer::getKneeboardPose(
        const VR::VRRenderConfig& vr,
        const SHM::SHMOverlayFrameConfig& layer,
        const Pose& hmdPose
    ) {
        if (!eyeHeight_) {
            eyeHeight_ = {hmdPose.position.y};
        }
        const auto& pose = layer.vr.pose;
        this->maybeRecenter(vr, hmdPose);
        auto matrix = Matrix::CreateRotationX(pose.rX) * Matrix::CreateRotationY(pose.rY) *
            Matrix::CreateRotationZ(pose.rZ) * Matrix::CreateTranslation({pose.x, pose.eyeY + *eyeHeight_, pose.z,}) *
            recenter_;

        return {.position = matrix.Translation(), .orientation = Quaternion::CreateFromRotationMatrix(matrix),};
    }

    OpenXRLayer::Vector2 OpenXRLayer::getKneeboardSize(
        const SHM::SHMConfig& config,
        const SHM::SHMOverlayFrameConfig& layer
    ) {
        const auto sizes = this->getSizes(config.vr, layer);

        return sizes.normalSize;
    }

    bool OpenXRLayer::isLookingAtKneeboard(
        const SHM::SHMConfig& config,
        const SHM::SHMOverlayFrameConfig& layer,
        const Pose& hmdPose,
        const Pose& kneeboardPose
    ) {
        auto& lookingAtBoard = isLookingAtKneeboard_[layer.overlayIdx];

        if (layer.vr.gazeTargetScale.horizontal < 0.1 || layer.vr.gazeTargetScale.vertical < 0.1) {
            return false;
        }

        const auto sizes = this->getSizes(config.vr, layer);
        auto currentSize = sizes.normalSize;

        currentSize.x *= layer.vr.gazeTargetScale.horizontal;
        currentSize.y *= layer.vr.gazeTargetScale.vertical;

        lookingAtBoard = Graphics::RayIntersectsRect(
            hmdPose.position,
            hmdPose.orientation,
            kneeboardPose.position,
            kneeboardPose.orientation,
            currentSize
        );

        return lookingAtBoard;
    }

    OpenXRLayer::Sizes OpenXRLayer::getSizes(const VR::VRRenderConfig& vrc, const SHM::SHMOverlayFrameConfig& layer) const {
        const auto& physicalSize = layer.vr.physicalSize;
        const auto virtualWidth = physicalSize.width();
        const auto virtualHeight = physicalSize.height();

        return {
            .normalSize = {virtualWidth, virtualHeight},
            // .zoomedSize = {virtualWidth * layer.vr.zoomScale, virtualHeight * layer.vr.zoomScale},
        };
    }

    OpenXRLayer::OpenXRLayer(
        XrInstance instance,
        XrSystemId system,
        XrSession session,
        OpenXRRuntimeID runtimeID,
        const std::shared_ptr<OpenXRNext>& next
    )
        : openXR_(next) {
        spdlog::debug("{}", __FUNCTION__);
        VRK_TraceLoggingScope("OpenXRLayer::OpenXRLayer()");

        XrSystemProperties systemProperties{.type = XR_TYPE_SYSTEM_PROPERTIES,};
        check_xrresult(next->xrGetSystemProperties(instance, system, &systemProperties));
        maxLayerCount_ = systemProperties.graphicsProperties.maxLayerCount;

        spdlog::debug("XR system: {}", std::string_view{systemProperties.systemName});
        // 'Max' appears to be a recommendation for the eyebox:
        // - ignoring it for quads appears to be widely compatible, and is common
        //   practice with other tools
        // - the spec for `XrSwapchainCreateInfo` only says I have to respect the
        //   graphics API's limits, not this one
        // - some runtimes (e.g. Steavr) have a *really* small size here that
        //   prevents spriting.
        spdlog::debug(
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
            spdlog::debug("Varjo runtime detected");
        }
    }

    OpenXRLayer::~OpenXRLayer() {
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

    OpenXRNext* OpenXRLayer::getOpenXR() {
        return openXR_.get();
    }

    XrResult OpenXRLayer::xrEndFrame(XrSession session, const XrFrameEndInfo* frameEndInfo) {
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
            TraceLoggingWriteTagged(activity, "No SHM layers");
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
            spdlog::debug("Created {}x{} swapchain", swapchainDimensions.width_, swapchainDimensions.height_);
        }

        if (!snapshot.hasTexture()) {
            snapshot = this->getSHM()->maybeGet();

            if (!snapshot.hasTexture()) {
                TraceLoggingWriteTagged(activity, "NoTexture");
                return openXR_->xrEndFrame(session, frameEndInfo);
            }
        }

        const auto hmdPose = this->GetHMDPose(frameEndInfo->displayTime);
        auto vrLayers = this->getLayers(snapshot, hmdPose);
        const auto layerCount = (vrLayers.size() + frameEndInfo->layerCount) <= maxLayerCount_ ?
                                    vrLayers.size() :
                                    (maxLayerCount_ - frameEndInfo->layerCount);
        if (layerCount == 0) {
            TraceLoggingWriteTagged(activity, "No active layers");
            return openXR_->xrEndFrame(session, frameEndInfo);
        }
        vrLayers.resize(layerCount);

        auto config = snapshot.getConfig();

        std::vector<const XrCompositionLayerBaseHeader*> nextLayers;
        nextLayers.reserve(frameEndInfo->layerCount + layerCount);
        std::copy(
            frameEndInfo->layers,
            &frameEndInfo->layers[frameEndInfo->layerCount],
            std::back_inserter(nextLayers)
        );

        uint8_t topMost = layerCount - 1;

        bool needRender = config.vr.quirks.alwaysUpdateSwapchain;
        std::vector<SHM::LayerSprite> layerSprites;
        std::vector<uint64_t> cacheKeys;
        std::vector<XrCompositionLayerQuad> addedXRLayers;
        layerSprites.reserve(layerCount);
        cacheKeys.reserve(layerCount);
        addedXRLayers.reserve(layerCount);

        for (size_t layerIndex = 0; layerIndex < layerCount; ++layerIndex) {
            const auto [layer, params] = vrLayers.at(layerIndex);

            cacheKeys.push_back(params.cacheKey);
            PixelRect destRect{
                Graphics::Spriting::GetOffset(layerIndex, snapshot.getOverlayCount()),
                layer->vr.locationOnTexture.size(),
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
                    .sourceRect = layer->vr.locationOnTexture,
                    .destRect = destRect,
                    .opacity = params.kneeboardOpacity,
                }
            );

            if (params.cacheKey != renderCacheKeys_.at(layerIndex)) {
                needRender = true;
            }

            if (params.isLookingAtKneeboard) {
                topMost = layerIndex;
            }

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
            pose.position = {-0.25f, 0.0f, -1.0f};
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
                    .size = XR_LAYER_DEFAULT_SIZE//{params.kneeboardSize.x, params.kneeboardSize.y},
                }
            );

            nextLayers.push_back(reinterpret_cast<XrCompositionLayerBaseHeader*>(&addedXRLayers.back()));
        }

        if (topMost != layerCount - 1) {
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
                spdlog::warn("next_xrEndFrame() failed: {}", static_cast<int>(nextResult));
            }
            else {
                spdlog::warn("next_xrEndFrame() failed: {} ({})", codeAsString, static_cast<int>(nextResult));
            }
        }
        return nextResult;
    }

    OpenXRLayer::Pose OpenXRLayer::GetHMDPose(XrTime displayTime) {
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

    OpenXRLayer::RenderParameters OpenXRLayer::getRenderParameters(
        const SHM::Snapshot& snapshot,
        const SHM::SHMOverlayFrameConfig& layer,
        const Pose& hmdPose
    ) {
        auto config = snapshot.getConfig();
        const auto kneeboardPose = this->getKneeboardPose(config.vr, layer, hmdPose);
        const auto isLookingAtKneeboard = this->isLookingAtKneeboard(config, layer, hmdPose, kneeboardPose);

        auto cacheKey = snapshot.getRenderCacheKey();
        if (isLookingAtKneeboard) {
            cacheKey |= 1;
        }
        else {
            cacheKey &= ~static_cast<size_t>(1);
        }

        return {
            .kneeboardPose = kneeboardPose,
            .kneeboardSize = this->getKneeboardSize(config, layer),
            .kneeboardOpacity = isLookingAtKneeboard ? layer.vr.opacity.gaze : layer.vr.opacity.normal,
            .cacheKey = cacheKey,
            .isLookingAtKneeboard = isLookingAtKneeboard,
        };
    }

    XrPosef OpenXRLayer::GetXrPosef(const Pose& pose) {
        const auto& p = pose.position;
        const auto& o = pose.orientation;
        return {.orientation = {o.x, o.y, o.z, o.w}, .position = {p.x, p.y, p.z},};
    }

    std::vector<OpenXRLayer::Layer> OpenXRLayer::getLayers(const SHM::Snapshot& snapshot, const Pose& hmdPose) {
        if (!eyeHeight_) {
            eyeHeight_ = {hmdPose.position.y};
        }

        const auto totalLayers = snapshot.getOverlayCount();

        std::vector<Layer> ret;
        ret.reserve(totalLayers);
        for (uint32_t layerIndex = 0; layerIndex < totalLayers; ++layerIndex) {
            const auto layerConfig = snapshot.getOverlayFrameConfig(layerIndex);
            if (!layerConfig->vrEnabled) {
                continue;
            }

            ret.push_back(Layer{layerConfig, getRenderParameters(snapshot, *layerConfig, hmdPose)});
        }

        const auto config = snapshot.getConfig();
        if (config.vr.enableGazeInputFocus) {
            const auto activeLayerID = config.globalInputLayerId;

            for (const auto& [layerConfig, renderParams] : std::ranges::reverse_view(ret)) {
                if (renderParams.isLookingAtKneeboard && layerConfig->overlayIdx != activeLayerID) {
                    // SHM::ActiveConsumers::SetActiveInGameViewID(layerConfig->layerID_);
                    break;
                }
            }
        }

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
        spdlog::debug("OpenXR runtime: '{}' v{:#x}", gRuntime.name, gRuntime.version);

        const auto ret = gNext->xrCreateSession(instance, createInfo, session);
        if (XR_FAILED(ret)) {
            spdlog::debug("next xrCreateSession failed: {}", static_cast<int>(ret));
            return ret;
        }

        if (gLayerInstance) {
            spdlog::debug("Already have a kneeboard, refusing to initialize twice");
            return XR_ERROR_INITIALIZATION_FAILED;
        }

        const auto system = createInfo->systemId;

        auto d3d11 = findInXrNextChain<XrGraphicsBindingD3D11KHR>(XR_TYPE_GRAPHICS_BINDING_D3D11_KHR, createInfo->next);
        if (d3d11 && d3d11->device) {
            gLayerInstance = new DX11::OpenXRDX11Layer(instance, system, *session, gRuntime, gNext, *d3d11);
            return ret;
        }


        spdlog::error("Unsupported graphics API");

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

        spdlog::critical(
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
        spdlog::info("{}", __FUNCTION__);
        // TODO: check version fields etc in layerInfo
        XrApiLayerCreateInfo nextLayerInfo = *layerInfo;
        nextLayerInfo.nextInfo = layerInfo->nextInfo->next;
        auto nextResult = layerInfo->nextInfo->nextCreateApiLayerInstance(info, &nextLayerInfo, instance);
        if (nextResult != XR_SUCCESS) {
            spdlog::debug("Next failed.");
            return nextResult;
        }

        gNext = std::make_shared<OpenXRNext>(*instance, layerInfo->nextInfo->nextGetInstanceProcAddr);

        spdlog::info("Created API layer instance");

        return XR_SUCCESS;
    }

    /* PS >
     * [System.Diagnostics.Tracing.EventSource]::new("OpenKneeboard.OpenXR")
     * a4308f76-39c8-5a50-4ede-32d104a8a78d
     */
    TRACELOGGING_DEFINE_PROVIDER(
        gTraceProvider,
        "IRT.OpenXR",
        (0xa4308f76, 0x39c8, 0x5a50, 0x4e, 0xde, 0x32, 0xd1, 0x04, 0xa8, 0xa7, 0x8d)
    );
} // namespace OpenKneeboard

using namespace IRacingTools::OpenXR;
using namespace IRacingTools::Shared;

BOOL WINAPI DllMain(HINSTANCE hinst, DWORD dwReason, LPVOID reserved) {
    switch (dwReason) {
    case DLL_PROCESS_ATTACH:
        // TraceLoggingRegister(gTraceProvider);
        // DPrintSettings::Set({
        //   .prefix = "OpenKneeboard-OpenXR",
        // });
        // spdlog::info(
        //   "{} {}, {}",
        //   __FUNCTION__,
        //   Version::ReleaseName,
        //   IsElevated(GetCurrentProcess()) ? "elevated" : "not elevated");
        spdlog::info("OpenXR Layer Attach {}", __FUNCTION__);
        break;
    case DLL_PROCESS_DETACH:
        // TraceLoggingUnregister(gTraceProvider);
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
    spdlog::debug("{}", __FUNCTION__);

    if (layerName != OpenXRLayerName) {
        spdlog::info("Layer name mismatch:\n -{}\n +{}", OpenXRLayerName, layerName);
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
