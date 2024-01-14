//
// Created by jglanz on 1/7/2024.
//

#pragma once
#include "DX11Resources.h"

namespace IRacingTools::Shared::Graphics {

class DX11TrackMapResources {
public:
    explicit DX11TrackMapResources(DX11DeviceResources *deviceResources);

    HRESULT render(DWORD dwTimeCur);
    bool isReady();

// protected:
    bool isD3DReady();
    HRESULT createD3DResources();
    HRESULT createD3DSizedResources();
    HRESULT createD2DResources();
    HRESULT createDeviceIndependentResources();
    HRESULT renderD2DContentIntoSurface();
    HRESULT createGridPatternBrush(ID2D1RenderTarget *pRenderTarget,
                                      ID2D1BitmapBrush **ppBitmapBrush);


private:

    std::atomic_bool ready_{false};
    std::atomic_bool disposed_{false};



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

    ComPtr<ID2D1RenderTarget> d2dRenderTarget_{nullptr};
    ComPtr<ID2D1LinearGradientBrush> lGBrush_{nullptr};
    ComPtr<ID2D1SolidColorBrush> blackBrush_{nullptr};
    ComPtr<ID2D1Bitmap> bitmap_{nullptr};

    ComPtr<ID3DX11EffectTechnique> techniqueNoRef_{nullptr};
    ComPtr<ID3DX11EffectMatrixVariable> worldVariableNoRef_{nullptr};
    ComPtr<ID3DX11EffectMatrixVariable> viewVariableNoRef_{nullptr};
    ComPtr<ID3DX11EffectMatrixVariable> projectionVariableNoRef_{nullptr};
    ComPtr<ID3DX11EffectShaderResourceVariable> diffuseVariableNoRef_{nullptr};

    // Device-Independent Resources
    ComPtr<IDWriteFactory> dwriteFactory_{nullptr};
    ComPtr<IDWriteTextFormat> textFormat_{nullptr};
    ComPtr<ID2D1PathGeometry> pathGeometry_{nullptr};

    DX11DeviceResources *deviceResources_;

    D3DXMATRIX worldMatrix_{};
    D3DXMATRIX viewMatrix_{};
    D3DXMATRIX projectionMatrix_{};

};

} // namespace IRacingTools::Shared::Graphics
