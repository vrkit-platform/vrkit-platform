//
// Created by jglanz on 1/28/2024.
//

#pragma once

#define XR_USE_GRAPHICS_API_D3D11

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <source_location>

#include <directxtk/SimpleMath.h>
#include <openxr/openxr.h>
#include <openxr/openxr_platform.h>

#include <format>
#include <span>

#include <memory>
#include <thread>


#include <IRacingTools/Shared/SHM/SHMDX11.h>
#include <IRacingTools/Shared/Timer.h>
#include <IRacingTools/Shared/UI/ViewerWindowRenderer.h>

#include "OpenXRDX11Renderer.h"


// template <class CharT>
// struct std::formatter<XrResult, CharT> : std::formatter<int, CharT> {};


namespace IRacingTools::OpenXR {
    using namespace Shared;

    struct OpenXRRuntimeID {
        XrVersion version;
        char name[XR_MAX_RUNTIME_NAME_SIZE];
    };

    class OpenXRNext;

    // : public VRKneeboard
    class OpenXRLayer {
    public:
        using Matrix = DirectX::SimpleMath::Matrix;
        using Quaternion = DirectX::SimpleMath::Quaternion;
        using Vector2 = DirectX::SimpleMath::Vector2;
        using Vector3 = DirectX::SimpleMath::Vector3;

        struct Pose {
            Vector3 position{};
            Quaternion orientation{};
        };

        struct RenderParameters {
            Pose kneeboardPose;
            Vector2 kneeboardSize;
            float kneeboardOpacity;
            size_t cacheKey;
            bool isLookingAtKneeboard;
        };

        struct Layer {
            const SHM::SHMOverlayFrameConfig* layerConfig{nullptr};
            RenderParameters renderParameters;
        };


        struct Sizes {
            Vector2 normalSize;
            // Vector2 zoomedSize;
        };

        OpenXRLayer() = delete;
        OpenXRLayer(XrInstance, XrSystemId, XrSession, OpenXRRuntimeID, const std::shared_ptr<OpenXRNext>&);
        virtual ~OpenXRLayer();

        XrResult xrEndFrame(XrSession session, const XrFrameEndInfo* frameEndInfo);

        std::vector<OpenXRLayer::Layer> getLayers(const SHM::Snapshot& snapshot, const Pose& hmdPose);

        RenderParameters getRenderParameters(const SHM::Snapshot&, const SHM::SHMOverlayFrameConfig&, const Pose& hmdPose);


        Pose getKneeboardPose(const VR::VRRenderConfig& vr, const SHM::SHMOverlayFrameConfig&, const Pose& hmdPose);

        Vector2 getKneeboardSize(const SHM::SHMConfig& config, const SHM::SHMOverlayFrameConfig&);

        bool isLookingAtKneeboard(
            const SHM::SHMConfig&,
            const SHM::SHMOverlayFrameConfig&,
            const Pose& hmdPose,
            const Pose& kneeboardPose
        );

        Sizes getSizes(const VR::VRRenderConfig&, const SHM::SHMOverlayFrameConfig&) const;


        void maybeRecenter(const VR::VRRenderConfig& vr, const Pose& hmdPose);
        void recenter(const VR::VRRenderConfig& vr, const Pose& hmdPose);

    protected:
        virtual XrSwapchain createSwapchain(XrSession, const PixelSize&) = 0;
        // Release any buffers, views, caches etc, but do not destroy the swap chain
        virtual void releaseSwapchainResources(XrSwapchain) = 0;

        virtual void renderLayers(
            XrSwapchain swapchain,
            uint32_t swapchainTextureIndex,
            const SHM::Snapshot& snapshot,
            const std::span<SHM::LayerSprite>& layers
        ) = 0;
        virtual SHM::SHMCachedReader* getSHM() = 0;

        OpenXRNext* getOpenXR();

        uint64_t recenterCount_ = 0;
        Matrix recenter_ = Matrix::Identity;
        std::unordered_map<uint64_t, bool> isLookingAtKneeboard_;
        std::optional<float> eyeHeight_;

    private:
        std::shared_ptr<OpenXRNext> openXR_;
        XrInstance xrInstance_{nullptr};
        uint64_t sessionID_{};

        uint32_t maxLayerCount_{};

        XrSwapchain swapchain_{};
        PixelSize swapchainDimensions_;
        std::array<uint64_t, MaxViewCount> renderCacheKeys_{};

        XrSpace localSpace_ = nullptr;
        XrSpace viewSpace_ = nullptr;

        bool isVarjoRuntime_{false};

        Pose GetHMDPose(XrTime displayTime);
        static XrPosef GetXrPosef(const Pose& pose);
    };

    namespace DX11 {
        class OpenXRDX11Layer final : public OpenXRLayer {
        public:
            OpenXRDX11Layer(
                XrInstance,
                XrSystemId,
                XrSession,
                OpenXRRuntimeID,
                const std::shared_ptr<OpenXRNext>&,
                const XrGraphicsBindingD3D11KHR&
            );
            virtual ~OpenXRDX11Layer() override;

            struct DXGIFormats {
                DXGI_FORMAT textureFormat;
                DXGI_FORMAT renderTargetViewFormat;
            };

            static DXGIFormats GetDXGIFormats(OpenXRNext*, XrSession);

        protected:
            virtual SHM::SHMCachedReader* getSHM() override;
            virtual XrSwapchain createSwapchain(XrSession, const PixelSize&) override;
            virtual void releaseSwapchainResources(XrSwapchain) override;

            virtual void renderLayers(
                XrSwapchain swapchain,
                uint32_t swapchainTextureIndex,
                const SHM::Snapshot& snapshot,
                const std::span<SHM::LayerSprite>& layers
            ) override;

        private:
            //SHM::ConsumerKind::OpenXR
            SHM::DX11::SHMDX11CachedReader shm_{SHM::ConsumerKind::OpenXR};

            winrt::com_ptr<ID3D11Device> device_;
            winrt::com_ptr<ID3D11DeviceContext> immediateContext_;
            std::unique_ptr<DX11::OpenXRDX11Renderer> renderer_;

            using SwapchainBufferResources = DX11::SwapchainBufferResources;
            using SwapchainResources = DX11::SwapchainResources;

            std::unordered_map<XrSwapchain, SwapchainResources> swapchainResources_;
        };
    }
} // namespace IRacingTools::Shared
