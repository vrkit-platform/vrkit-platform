//
// Created by jglanz on 1/7/2024.
//

#pragma once
#include "DX11Resources.h"
#include <IRacingTools/Models/TrackMapData.pb.h>

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
    HRESULT renderTrackMapIntoSurface();
    HRESULT createGridPatternBrush(ID2D1RenderTarget *pRenderTarget,
                                      ID2D1BitmapBrush **ppBitmapBrush);

    HRESULT createTrackMapResources();
private:

    std::atomic_bool ready_{false};
    std::atomic_bool disposed_{false};
    std::optional<TrackMap> trackMapOpt_{std::nullopt};
    std::mutex trackMapMutex_{};
    std::mutex renderMutex_{};
    std::atomic_flag trackMapChanged_ = ATOMIC_FLAG_INIT;

    ComPtr<ID2D1RenderTarget> backBufferRT_{nullptr};
    ComPtr<ID2D1SolidColorBrush> backBufferTextBrush_{nullptr};
    // ComPtr<ID2D1LinearGradientBrush> backBufferGradientBrush_{nullptr};
    // ComPtr<ID2D1BitmapBrush> gridPatternBitmapBrush_{nullptr};

    ComPtr<ID2D1SolidColorBrush> blackBrush_{nullptr};
    ComPtr<ID2D1Bitmap> bitmap_{nullptr};


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
