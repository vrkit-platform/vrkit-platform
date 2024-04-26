#pragma once

#include "../SharedAppLibPCH.h"
#include <algorithm>

#include <IRacingTools/Shared/Macros.h>
#include <atomic>
#include <functional>
#include <mutex>

namespace IRacingTools::Shared::Graphics {

  using Microsoft::WRL::ComPtr;

struct Size {
    UINT width{0};
    UINT height{0};
};

struct DeviceListener {
    virtual void onDeviceLost() = 0;
    virtual void onDeviceRestored() = 0;

    virtual ~DeviceListener() = default;
};

enum class DXVersion { DX11, DX12 };

/**
 * \brief
 * \tparam V
 */
template<DXVersion V>
struct DXVersionTypes {};

template<>
struct DXVersionTypes<DXVersion::DX11> {
  using DGFactoryType =  IDXGIFactory6;
  using DGAdapterType = IDXGIAdapter4;
  using DGDeviceType = IDXGIDevice2;

    using DeviceType = ID3D11Device5;
    using MultiThreadedType = ID3D11Multithread;

    using DeviceContextType = ID3D11DeviceContext4;
    using SwapChainType = IDXGISwapChain;
    using RasterizerStateType = ID3D11RasterizerState;
    using RenderTargetViewType = ID3D11RenderTargetView;

    using RenderTarget2DType = ID2D1RenderTarget;
    using Texture2DType = ID3D11Texture2D;

    using DepthStenciViewType = ID3D11DepthStencilView;

    using ViewportType = D3D11_VIEWPORT;

    using EffectType = ID3DX11Effect;
};

#define DXResT(V, T) typename DXResources<V>::T
#define DXResTPtr(V, T) ComPtr<DXResT(V, T)>

template<DXVersion V>
class DXResources {
public:
    using Config = DXVersionTypes<V>;


  using DGFactory = typename Config::DGFactoryType;
  using DGAdapter = typename Config::DGAdapterType;
  using DGDevice = typename Config::DGDeviceType;

  using DGAdapterLUID = uint64_t;

  using Device = typename Config::DeviceType;
    using DeviceContext = typename Config::DeviceContextType;
    using SwapChain = typename Config::SwapChainType;
    using RasterizerState = typename Config::RasterizerStateType;

    using RenderTargetView = typename Config::RenderTargetViewType;
    using RenderTarget2D = typename Config::RenderTarget2DType;

    using Texture2D = typename Config::Texture2DType;
    using DepthStencilView = typename Config::DepthStenciViewType;
    using Viewport = typename Config::ViewportType;

    using Effect = typename Config::EffectType;

    // function prototypes
    virtual ~DXResources() = default;

  virtual DXResTPtr(V, DGFactory) &getDGFactory() = 0;
  virtual DXResTPtr(V, DGAdapter) &getDGAdapter() = 0;
  virtual DXResTPtr(V, DGDevice) &getDGDevice() = 0;
  virtual DGAdapterLUID getDGAdapterLUID() = 0;

    virtual DXResTPtr(V, Device) &getDevice() = 0;
    virtual DXResTPtr(V, DeviceContext) &getDeviceContext() = 0;
    virtual DXResTPtr(V, SwapChain) &getSwapChain() = 0;
    virtual DXResTPtr(V, RasterizerState) &getRasterizerState() = 0;

    virtual DXResTPtr(V, Texture2D) &getRenderTarget() = 0;
    virtual DXResTPtr(V, Texture2D) &getDepthStencil() = 0;

    virtual DXResTPtr(V, RenderTargetView) &getRenderTargetView() = 0;
    virtual DXResTPtr(V, DepthStencilView) &getDepthStencilView() = 0;
    virtual DXResT(V, Viewport) getViewport() = 0;

    virtual DXGI_FORMAT getBackBufferFormat() = 0;
    virtual DXGI_FORMAT getDepthBufferFormat() = 0;
    virtual UINT getBackBufferCount() = 0;
    virtual Size getSize() = 0;
};

template<DXVersion V>
class DXDeviceResources : public DXResources<V> {
public:
  DXResTPtr(V, DGFactory) &getDGFactory() override { return dgFactory_; };
  DXResTPtr(V, DGAdapter) &getDGAdapter() override { return dgAdapter_; };
  DXResTPtr(V, DGDevice) &getDGDevice() override { return dgDevice_; };
  virtual DGAdapterLUID getDGAdapterLUID() override { return dgAdapterLUID_; };

    DXResTPtr(V, Device) &getDevice() override { return dev_; };
    DXResTPtr(V, DeviceContext) &getDeviceContext() override { return devContext_; };
    DXResTPtr(V, SwapChain) &getSwapChain() override { return swapChain_; };
    DXResTPtr(V, RasterizerState) &getRasterizerState() override { return rasterizerState_; };

    DXResTPtr(V, Texture2D) &getRenderTarget() override { return renderTarget_; };
    DXResTPtr(V, Texture2D) &getDepthStencil() override { return depthStencil_; };

    DXResTPtr(V, RenderTargetView) &getRenderTargetView() override { return renderTargetView_; };
    DXResTPtr(V, DepthStencilView) &getDepthStencilView() override { return depthStencilView_; };
    DXResT(V, Viewport) getViewport() override { return viewport_; }

    DXGI_FORMAT getBackBufferFormat() override { return backBufferFormat_; }
    DXGI_FORMAT getDepthBufferFormat() override { return depthBufferFormat_; }

    UINT getBackBufferCount() override { return backBufferCount_; }
    Size getSize() override { return size_; };

    virtual ComPtr<IWICImagingFactory> &getWICFactory() { return wicFactory_; };

    virtual ComPtr<ID2D1Factory> &createD2DFactory(D2D1_FACTORY_TYPE factoryType) {
        AssertOkMsg(
            D2D1CreateFactory(factoryType, d2dFactory_.ReleaseAndGetAddressOf()),
            "Unable to create d2d factory"
        );
        return d2dFactory_;
    };

    virtual ComPtr<ID2D1Factory> &getOrCreateD2DFactory(D2D1_FACTORY_TYPE factoryType) {
        if (!d2dFactory_) {
            return createD2DFactory(factoryType);
        }

        return d2dFactory_;
    }

    virtual ComPtr<ID2D1Factory> &getD2DFactory() { return d2dFactory_; };

    HRESULT createShaderFromMemory(
        DXResT(V, Device) *pDevice,
        const void *pData,
        SIZE_T dataSize,
        DXResT(V, Effect) * *ppShader
    ) {
        return ::D3DX11CreateEffectFromMemory(pData, dataSize, 0, pDevice, ppShader);
    }

    HRESULT createBitmapFromMemory(
        ID2D1RenderTarget *pRenderTarget,
        IWICImagingFactory *pIWICFactory,
        unsigned char *data,
        size_t dataLen,
        UINT destinationWidth,
        UINT destinationHeight,
        ID2D1Bitmap **ppBitmap
    ) {
        HRESULT hr = S_OK;
        ComPtr<IWICBitmapDecoder> pDecoder = nullptr;
        ComPtr<IWICBitmapFrameDecode> pSource = nullptr;
        ComPtr<IWICStream> pStream = nullptr;
        ComPtr<IWICFormatConverter> pConverter = nullptr;
        ComPtr<IWICBitmapScaler> pScaler = nullptr;

        AOK(hr);
        // Create a WIC stream to map onto the memory.
        winrt::check_hresult(pIWICFactory->CreateStream(&pStream));

        // Initialize the stream with the memory pointer and size.
        winrt::check_hresult(pStream->InitializeFromMemory(data, dataLen));
        // Create a decoder for the stream.
        winrt::check_hresult(
            pIWICFactory->CreateDecoderFromStream(pStream.Get(), nullptr, WICDecodeMetadataCacheOnLoad, &pDecoder)
        );
        // Create the initial frame.
        winrt::check_hresult(pDecoder->GetFrame(0, &pSource));
        // Convert the image format to 32bppPBGRA
        // (DXGI_FORMAT_B8G8R8A8_UNORM + D2D1_ALPHA_MODE_PREMULTIPLIED).
        winrt::check_hresult(pIWICFactory->CreateFormatConverter(&pConverter));
        // If a new width or height was specified, create an
        // IWICBitmapScaler and use it to resize the image.
        if (destinationWidth != 0 || destinationHeight != 0) {
            UINT originalWidth, originalHeight;
            winrt::check_hresult(pSource->GetSize(&originalWidth, &originalHeight));

            if (destinationWidth == 0) {
                FLOAT scalar = static_cast<FLOAT>(destinationHeight) / static_cast<FLOAT>(originalHeight);
                destinationWidth = static_cast<UINT>(scalar * static_cast<FLOAT>(originalWidth));
            } else if (destinationHeight == 0) {
                FLOAT scalar = static_cast<FLOAT>(destinationWidth) / static_cast<FLOAT>(originalWidth);
                destinationHeight = static_cast<UINT>(scalar * static_cast<FLOAT>(originalHeight));
            }

            winrt::check_hresult(pIWICFactory->CreateBitmapScaler(&pScaler));

            winrt::check_hresult(
                pScaler->Initialize(pSource.Get(), destinationWidth, destinationHeight, WICBitmapInterpolationModeCubic)
            );

            winrt::check_hresult(
                pConverter->Initialize(
                    pScaler.Get(),
                    GUID_WICPixelFormat32bppPBGRA,
                    WICBitmapDitherTypeNone,
                    nullptr,
                    0.f,
                    WICBitmapPaletteTypeMedianCut
                )
            );
        } else {
            winrt::check_hresult(
                pConverter->Initialize(
                    pSource.Get(),
                    GUID_WICPixelFormat32bppPBGRA,
                    WICBitmapDitherTypeNone,
                    nullptr,
                    0.f,
                    WICBitmapPaletteTypeMedianCut
                )
            );
        }

        // create a Direct2D bitmap from the WIC bitmap.
        winrt::check_hresult(pRenderTarget->CreateBitmapFromWicBitmap(pConverter.Get(), nullptr, ppBitmap));

        return hr;
    };

protected:
    using DXDisposer = std::function<void()>;

    void addDisposer(const DXDisposer &disposer) {
        std::scoped_lock lock(disposalMutex_);
        if (!disposed_)
            disposers_.push_back(disposer);
    };

    // Direct3D objects.
    // ComPtr<IDXGIFactory2> dxgiFactory_{nullptr};
    DXResTPtr(V, DGFactory) dgFactory_{nullptr};
    DXResTPtr(V, DGAdapter) dgAdapter_{nullptr};
    DXResTPtr(V, DGDevice) dgDevice_{nullptr};
    DXResT(V,DGAdapterLUID) dgAdapterLUID_{0};

    DXResTPtr(V, Device) dev_{nullptr};
    DXResTPtr(V, DeviceContext) devContext_{nullptr};
    DXResTPtr(V, SwapChain) swapChain_{nullptr};
    DXResTPtr(V, RasterizerState) rasterizerState_{nullptr};

    // Direct3D rendering objects. Required for 3D.
    DXResTPtr(V, Texture2D) renderTarget_{nullptr};
    DXResTPtr(V, Texture2D) depthStencil_{nullptr};
    DXResTPtr(V, RenderTargetView) renderTargetView_{nullptr};
    DXResTPtr(V, DepthStencilView) depthStencilView_{nullptr};

    DXResT(V, Viewport) viewport_{};

    ComPtr<IWICImagingFactory> wicFactory_{nullptr};
    //Direct2D
    ComPtr<ID2D1Factory> d2dFactory_{nullptr};

    // Direct3D properties.
    DXGI_FORMAT backBufferFormat_{};
    DXGI_FORMAT depthBufferFormat_{};
    UINT backBufferCount_{};

    // Cached device properties.
    D3D_FEATURE_LEVEL featureLevel_{};
    RECT outputSize_{}; // HDR Support
    DXGI_COLOR_SPACE_TYPE colorSpace_{};

    // DeviceResources options (see flags above)
    unsigned int options_{0};

    Size size_{0, 0};

private:
    void disposeInternal_() {
        std::scoped_lock lock(disposalMutex_);
        if (disposed_.exchange(true)) {
            std::ranges::for_each(disposers_, [](auto &fn) { fn(); });
            disposers_.clear();
        }
    }

    std::vector<DXDisposer> disposers_{};
    std::atomic_bool disposed_{false};
    std::mutex disposalMutex_{};

    // The IDeviceNotify can be held directly as it owns the DeviceResources.
    DeviceListener *deviceNotify_{nullptr};
};
} // namespace IRacingTools::Shared::Graphics
