//
// Created by jglanz on 1/7/2024.
//

#pragma once
#include "DXResourceProvider.h"

namespace IRacingTools {
namespace Shared {
namespace Graphics {

class DX11TrackMapRenderer {
public:
  explicit DX11TrackMapRenderer(DX11ResourceProvider * resourceProvider);


  bool isReady() const;

protected:
  HRESULT createD3DResources();
  HRESULT LoadResourceShader(
        ID3D11Device *pDevice,
        PCWSTR pszResource,
        ID3DX11Effect **ppShader
        );

private:
  std::atomic_bool ready_{false};
  std::atomic_bool disposed_{false};

  ComPtr<ID3D11RenderTargetView> renderTargetView_{nullptr};
  ComPtr<ID3D11Texture2D> depthStencil_{nullptr};
  ComPtr<ID3D11DepthStencilView> depthStencilView_{nullptr};
  ComPtr<ID3D11Texture2D> offscreenTexture_{nullptr};
  ComPtr<ID3DX11Effect> shader_{nullptr};
  ComPtr<ID3D11Buffer> vertexBuffer_{nullptr};
  ComPtr<ID3D11InputLayout> vertexLayout_{nullptr};
  ComPtr<ID3D11Buffer> facesIndexBuffer_{nullptr};
  ComPtr<ID3D11ShaderResourceView> textureRV_{nullptr};

  ComPtr<ID2D1RenderTarget> backBufferRT_{nullptr};
  ComPtr<ID2D1SolidColorBrush> backBufferTextBrush_{nullptr};
  ComPtr<ID2D1LinearGradientBrush> backBufferGradientBrush_{nullptr};
  ComPtr<ID2D1BitmapBrush> gridPatternBitmapBrush_{nullptr};

  ComPtr<ID2D1RenderTarget> renderTarget_{nullptr};
  ComPtr<ID2D1LinearGradientBrush> lGBrush_{nullptr};
  ComPtr<ID2D1SolidColorBrush> blackBrush_{nullptr};
  ComPtr<ID2D1Bitmap> bitmap_{nullptr};

  ComPtr<ID3DX11EffectTechnique> techniqueNoRef_{nullptr};
  ComPtr<ID3DX11EffectMatrixVariable> worldVariableNoRef_{nullptr};
  ComPtr<ID3DX11EffectMatrixVariable> viewVariableNoRef_{nullptr};
  ComPtr<ID3DX11EffectMatrixVariable> projectionVariableNoRef_{nullptr};
  ComPtr<ID3DX11EffectShaderResourceVariable> diffuseVariableNoRef_{nullptr};

  // Device-Independent Resources
  ComPtr<IDWriteTextFormat> textFormat_{nullptr};
  ComPtr<ID2D1PathGeometry> pathGeometry_{nullptr};

  DX11ResourceProvider * resourceProvider_;

  D3DXMATRIX worldMatrix_{};
  D3DXMATRIX viewMatrix_{};
  D3DXMATRIX projectionMatrix_{};

};

} // Graphics
} // Shared
} // IRacingTools
