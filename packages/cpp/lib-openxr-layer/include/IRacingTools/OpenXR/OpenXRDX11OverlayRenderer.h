#pragma once

#define XR_USE_GRAPHICS_API_D3D11

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <openxr/openxr.h>
#include <openxr/openxr_platform.h>

#include <format>
#include <span>

#include <memory>
#include <SpriteBatch.h>
#include <thread>


#include <IRacingTools/Shared/SHM/SHMDX11.h>
#include <IRacingTools/Shared/Timer.h>
#include <IRacingTools/Shared/Graphics/DX113D.h>
#include <IRacingTools/Shared/UI/ViewerWindowRenderer.h>


template <class CharT>
struct std::formatter<XrResult, CharT> : std::formatter<int, CharT> {};


namespace IRacingTools::OpenXR::DX11 {
    using namespace Shared;

    enum class RenderMode {
        // Usually wanted for VR as we have our own swapchain for
        // our compositor layers
        ClearAndRender,
        // Usually wanted for non-VR as we're rendering on top of the
        // application's swapchain texture
        Overlay,
    };


    struct SwapchainBufferResources {
        SwapchainBufferResources() = delete;
        SwapchainBufferResources(ID3D11Device*, ID3D11Texture2D*, DXGI_FORMAT renderTargetViewFormat);

        ID3D11Texture2D* texture{nullptr};
        winrt::com_ptr<ID3D11RenderTargetView> renderTargetView{};
    };

    struct SwapchainResources {
        PixelSize dimensions;
        std::vector<SwapchainBufferResources> bufferResources;
    };

    class OpenXRDX11OverlayRenderer {
    public:
        OpenXRDX11OverlayRenderer() = delete;
        explicit OpenXRDX11OverlayRenderer(ID3D11Device*);

        void renderLayers(
            const SwapchainResources&,
            uint32_t swapchainTextureIndex,
            const SHM::Snapshot& snapshot,
            const std::span<SHM::LayerSprite>& layers,
            RenderMode
        );

    private:
        std::unique_ptr<Graphics::SpriteBatch> spriteBatch_;
    };
}
