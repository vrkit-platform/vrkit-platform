//
// Created by jglanz on 5/1/2024.
//

#pragma once


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/SHM/SHM.h>


#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

namespace IRacingTools::Shared::Graphics {
    /**
     * Hold shared texture resources
     */
    struct IPCTextureResources {
        winrt::com_ptr<ID3D11Texture2D> texture;
        winrt::com_ptr<ID3D11RenderTargetView> renderTargetView;

        winrt::handle textureHandle;
        PixelSize textureSize;

        winrt::com_ptr<ID3D11Fence> fence;
        winrt::handle fenceHandle;

        D3D11_VIEWPORT viewport{};
    };


    class IPCRenderer : public std::enable_shared_from_this<IPCRenderer> {
        std::array<IPCTextureResources, SHMSwapchainLength> ipcSwapchain_{};
        std::shared_ptr<DXResources> dxr_;
        std::shared_ptr<SHM::Writer> writer_;

        std::shared_ptr<RenderTarget> target_{};
        PixelSize canvasSize_{};

        std::atomic_flag isRendering_;

        explicit IPCRenderer(const std::shared_ptr<DXResources>& dxr);

    public:
        static std::shared_ptr<IPCRenderer> Create(const std::shared_ptr<DXResources>& dxr);

        IPCRenderer() = delete;

        IPCRenderer(IPCRenderer&&) = delete;
        IPCRenderer(const IPCRenderer&) = delete;

        IPCTextureResources*
        getIPCTextureResources(uint8_t textureIndex, const PixelSize& size);



        void initializeCanvas(const PixelSize&);

        void renderNow(const std::shared_ptr<RenderTarget>& sourceTarget) noexcept;

        void submitFrame(
  const std::vector<SHM::LayerConfig>& shmLayers,
  std::uint64_t inputLayerID) noexcept;
    };


}
