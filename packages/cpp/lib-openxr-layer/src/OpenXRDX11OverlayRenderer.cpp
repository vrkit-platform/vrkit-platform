#define XR_USE_GRAPHICS_API_D3D11

#include <IRacingTools/OpenXR/OpenXRDX11OverlayRenderer.h>
#include <IRacingTools/SDK/Utils/Tracing.h>
#include <IRacingTools/Shared/Graphics/DX113D.h>

#include <spdlog/spdlog.h>


namespace IRacingTools::OpenXR::DX11 {
    
    SwapchainBufferResources::SwapchainBufferResources(
      ID3D11Device* device,
      ID3D11Texture2D* texture,
      DXGI_FORMAT renderTargetViewFormat) {
        this->texture = texture;

        D3D11_TEXTURE2D_DESC textureDesc;
        texture->GetDesc(&textureDesc);

        D3D11_RENDER_TARGET_VIEW_DESC rtvDesc {
            .Format = renderTargetViewFormat,
            .ViewDimension = D3D11_RTV_DIMENSION_TEXTURE2D,
            .Texture2D = {0},
          };
        check_hresult(
          device->CreateRenderTargetView(texture, &rtvDesc, this->renderTargetView.put()));
    }

    OpenXRDX11OverlayRenderer::OpenXRDX11OverlayRenderer(ID3D11Device* device) {
        spriteBatch_ = std::make_unique<Graphics::SpriteBatch>(device);
    }

    void OpenXRDX11OverlayRenderer::renderLayers(
      const SwapchainResources& sr,
      uint32_t swapchainTextureIndex,
      const SHM::Snapshot& snapshot,
      const std::span<SHM::LayerSprite>& layers,
      RenderMode renderMode) {
        VRK_TraceLoggingScope("D3D11::OpenXRDX11Renderer::RenderLayers()"); // NOLINT(*-pro-type-member-init)

        auto source
          = snapshot.getTexture<SHM::DX11::Texture>()->getD3D11ShaderResourceView();

        const auto& br = sr.bufferResources.at(swapchainTextureIndex);

        auto dest = br.renderTargetView.get();

        spriteBatch_->begin(dest, sr.dimensions);

        if (renderMode == RenderMode::ClearAndRender) {
            spriteBatch_->clear();
        }

        const auto baseTint = snapshot.getConfig().tint;

        for (const auto& layer: layers) {
            const DirectX::XMVECTORF32 layerTint {
                baseTint[0] * layer.opacity,
                baseTint[1] * layer.opacity,
                baseTint[2] * layer.opacity,
                baseTint[3] * layer.opacity,
              };
            spriteBatch_->draw(source, layer.sourceRect, layer.destRect, layerTint);
        }
        spriteBatch_->end();
    }
}