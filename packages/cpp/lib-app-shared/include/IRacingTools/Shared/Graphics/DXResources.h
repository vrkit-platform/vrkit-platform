#pragma once


#include <atomic>
#include <functional>
#include <mutex>

#include <IRacingTools/SDK/Utils/LockHelpers.h>
#include <IRacingTools/SDK/Utils/LockHelpers.h>

#include "../Macros.h"
#include "../SharedAppLibPCH.h"
#include "DX113D.h"




namespace IRacingTools::Shared::Graphics {

  // using Microsoft::WRL::ComPtr;

  // /using Size = Size<UINT>;
  // struct Size {
  //     UINT width{0};
  //     UINT height{0};
  // };

  struct DeviceListener {
    virtual void onDeviceLost() = 0;

    virtual void onDeviceRestored() = 0;

    virtual ~DeviceListener() = default;
  };


  /** Resources needed for anything in OpenKneeboard using D3D11.
   *
   * This includes:
   * - the main app
   * - the SteamVR implementation (which uses its' own devices)
   * - the viewer
   */
  class D3D11Resources : public SDK::Utils::Lockable {
  protected:
    D3D11Resources();


    winrt::com_ptr<IDXGIFactory6> dxgiFactory_;
    winrt::com_ptr<IDXGIAdapter4> dxgiAdapter_;
    uint64_t dxgiAdapterLUID_;

    winrt::com_ptr<ID3D11Device5> dxDevice_;
    winrt::com_ptr<ID3D11DeviceContext4> dxImmediateContext_;

    winrt::com_ptr<IDXGIDevice2> dxgiDevice_;

  public:
    ~D3D11Resources();

    D3D11Resources(const D3D11Resources &) = delete;

    D3D11Resources &operator=(const D3D11Resources &) = delete;

    winrt::com_ptr<IDXGIFactory6> &getDXGIFactory();

    winrt::com_ptr<IDXGIAdapter4> &getDXGIAdapter();

    uint64_t getDXGIAdapterLUID();

    winrt::com_ptr<ID3D11Device5> &getDXDevice();

    winrt::com_ptr<ID3D11DeviceContext4> &getDXImmediateContext();

    winrt::com_ptr<IDXGIDevice2> &getDXGIDevice();

    // virtual HWND windowHandle() const = 0;

    // Use `std::unique_lock`
    void lock() override;

    bool try_lock() override;

    void unlock() override;

  private:
    struct Locks;
    std::unique_ptr<Locks> locks_;
  };

  /** Additional resources needed for Direct2D + DirectWrite.
   *
   * I've included DirectWrite here for now as it's the only current
   * reason for using Direct2D.
   *
   * D3D should be preferred in new code for basic primitives.
   */
  class D2DResources {

  public:
    D2DResources() = delete;

    D2DResources(const D2DResources &) = delete;

    ~D2DResources();

  protected:

    explicit D2DResources(D3D11Resources *);

    D2DResources &operator=(const D2DResources &) = delete;

    winrt::com_ptr<ID2D1Factory1> d2dFactory_;

    winrt::com_ptr<ID2D1Device> d2dDevice_;
    winrt::com_ptr<ID2D1DeviceContext5> d2dDeviceContext_;

    winrt::com_ptr<IDWriteFactory> directWriteFactory_;

  public:
    // Use like push/pop, but only one is allowed at a time; this exists
    // to get better debugging information/breakpoints when that's not the case
    void pushD2DDraw();

    HRESULT popD2DDraw();


    winrt::com_ptr<ID2D1Factory1> &getD2DFactory();

    winrt::com_ptr<ID2D1Device> &getD2DDevice();

    winrt::com_ptr<ID2D1DeviceContext5> &getD2DDeviceContext();

    winrt::com_ptr<IDWriteFactory> &getDirectWriteFactory();


  private:
    struct Locks;
    std::unique_ptr<Locks> locks_;
  };

  /// Resources for the OpenKneeboard app
  class DXResources : public D3D11Resources, public D2DResources {
  public:
    DXResources();

    DXResources(const DXResources &) = delete;

    DXResources(DXResources &&) = delete;

    DXResources &operator=(const DXResources &) = delete;

    DXResources &operator=(DXResources &&) = delete;



    // winrt::com_ptr<IWICImagingFactory> &getWICImagingFactory();

    // Brushes :)

    // Would like something more semantic for this one; used for:
    // - PDF background
    winrt::com_ptr<ID2D1SolidColorBrush> &getWhiteBrush();

    // - PDF links
    // - Button mouseovers
    winrt::com_ptr<ID2D1SolidColorBrush> &getHighlightBrush();

    //-  Doodle pen
    winrt::com_ptr<ID2D1SolidColorBrush> &getBlackBrush();

    //-  Doodle eraser
    winrt::com_ptr<ID2D1SolidColorBrush> &getEraserBrush();

    winrt::com_ptr<ID2D1SolidColorBrush> &getCursorInnerBrush();

    winrt::com_ptr<ID2D1SolidColorBrush> &getCursorOuterBrush();

  protected:

    std::unique_ptr<SpriteBatch> spriteBatch_;

    // e.g. doodles draw to a separate texture

    Microsoft::WRL::ComPtr<ID2D1DeviceContext5> s2sBackBufferDeviceContext_;

    //winrt::com_ptr<IWICImagingFactory> wicImagingFactory_;

    // Brushes :)

    // Would like something more semantic for this one; used for:
    // - PDF background
    winrt::com_ptr<ID2D1SolidColorBrush> whiteBrush_;
    // - PDF links
    // - Button mouseovers
    winrt::com_ptr<ID2D1SolidColorBrush> highlightBrush_;
    //-  Doodle pen
    winrt::com_ptr<ID2D1SolidColorBrush> blackBrush_;
    //-  Doodle eraser
    winrt::com_ptr<ID2D1SolidColorBrush> eraserBrush_;

    winrt::com_ptr<ID2D1SolidColorBrush> cursorInnerBrush_;
    winrt::com_ptr<ID2D1SolidColorBrush> cursorOuterBrush_;


  };

  //
  // class DXDeviceResources : public DXResources {
  // public:
  //   DXResTPtr(V, DGFactory) &getDGFactory() override { return dgFactory_; };
  //   DXResTPtr(V, DGAdapter) &getDGAdapter() override { return dgAdapter_; };
  //   DXResTPtr(V, DGDevice) &getDGDevice() override { return dgDevice_; };
  //   virtual DGAdapterLUID getDGAdapterLUID() override { return dgAdapterLUID_; };
  //
  //     DXResTPtr(V, Device) &getDevice() override { return dev_; };
  //     DXResTPtr(V, DeviceContext) &getDeviceContext() override { return devContext_; };
  //     DXResTPtr(V, SwapChain) &getSwapChain() override { return swapChain_; };
  //     DXResTPtr(V, RasterizerState) &getRasterizerState() override { return rasterizerState_; };
  //
  //     DXResTPtr(V, Texture2D) &getRenderTarget() override { return renderTarget_; };
  //     DXResTPtr(V, Texture2D) &getDepthStencil() override { return depthStencil_; };
  //
  //     DXResTPtr(V, RenderTargetView) &getRenderTargetView() override { return renderTargetView_; };
  //     DXResTPtr(V, DepthStencilView) &getDepthStencilView() override { return depthStencilView_; };
  //     DXResT(V, Viewport) getViewport() override { return viewport_; }
  //
  //     DXGI_FORMAT getBackBufferFormat() override { return backBufferFormat_; }
  //     DXGI_FORMAT getDepthBufferFormat() override { return depthBufferFormat_; }
  //
  //     UINT getBackBufferCount() override { return backBufferCount_; }
  //     Size getSize() override { return size_; };
  //
  //     virtual ComPtr<IWICImagingFactory> &getWICFactory() { return wicFactory_; };
  //
  //     virtual ComPtr<ID2D1Factory> &createD2DFactory(D2D1_FACTORY_TYPE factoryType) {
  //         AssertOkMsg(
  //             D2D1CreateFactory(factoryType, d2dFactory_.ReleaseAndGetAddressOf()),
  //             "Unable to create d2d factory"
  //         );
  //         return d2dFactory_;
  //     };
  //
  //     virtual ComPtr<ID2D1Factory> &getOrCreateD2DFactory(D2D1_FACTORY_TYPE factoryType) {
  //         if (!d2dFactory_) {
  //             return createD2DFactory(factoryType);
  //         }
  //
  //         return d2dFactory_;
  //     }
  //
  //     virtual ComPtr<ID2D1Factory> &getD2DFactory() { return d2dFactory_; };
  //
  //     HRESULT createShaderFromMemory(
  //         DXResT(V, Device) *pDevice,
  //         const void *pData,
  //         SIZE_T dataSize,
  //         DXResT(V, Effect) * *ppShader
  //     ) {
  //         return ::D3DX11CreateEffectFromMemory(pData, dataSize, 0, pDevice, ppShader);
  //     }
  //
  //     HRESULT createBitmapFromMemory(
  //         ID2D1RenderTarget *pRenderTarget,
  //         IWICImagingFactory *pIWICFactory,
  //         unsigned char *data,
  //         size_t dataLen,
  //         UINT destinationWidth,
  //         UINT destinationHeight,
  //         ID2D1Bitmap **ppBitmap
  //     ) {
  //         HRESULT hr = S_OK;
  //         ComPtr<IWICBitmapDecoder> pDecoder = nullptr;
  //         ComPtr<IWICBitmapFrameDecode> pSource = nullptr;
  //         ComPtr<IWICStream> pStream = nullptr;
  //         ComPtr<IWICFormatConverter> pConverter = nullptr;
  //         ComPtr<IWICBitmapScaler> pScaler = nullptr;
  //
  //         AOK(hr);
  //         // Create a WIC stream to map onto the memory.
  //         winrt::check_hresult(pIWICFactory->CreateStream(&pStream));
  //
  //         // Initialize the stream with the memory pointer and size.
  //         winrt::check_hresult(pStream->InitializeFromMemory(data, dataLen));
  //         // Create a decoder for the stream.
  //         winrt::check_hresult(
  //             pIWICFactory->CreateDecoderFromStream(pStream.Get(), nullptr, WICDecodeMetadataCacheOnLoad, &pDecoder)
  //         );
  //         // Create the initial frame.
  //         winrt::check_hresult(pDecoder->GetFrame(0, &pSource));
  //         // Convert the image format to 32bppPBGRA
  //         // (DXGI_FORMAT_B8G8R8A8_UNORM + D2D1_ALPHA_MODE_PREMULTIPLIED).
  //         winrt::check_hresult(pIWICFactory->CreateFormatConverter(&pConverter));
  //         // If a new width or height was specified, create an
  //         // IWICBitmapScaler and use it to resize the image.
  //         if (destinationWidth != 0 || destinationHeight != 0) {
  //             UINT originalWidth, originalHeight;
  //             winrt::check_hresult(pSource->GetSize(&originalWidth, &originalHeight));
  //
  //             if (destinationWidth == 0) {
  //                 FLOAT scalar = static_cast<FLOAT>(destinationHeight) / static_cast<FLOAT>(originalHeight);
  //                 destinationWidth = static_cast<UINT>(scalar * static_cast<FLOAT>(originalWidth));
  //             } else if (destinationHeight == 0) {
  //                 FLOAT scalar = static_cast<FLOAT>(destinationWidth) / static_cast<FLOAT>(originalWidth);
  //                 destinationHeight = static_cast<UINT>(scalar * static_cast<FLOAT>(originalHeight));
  //             }
  //
  //             winrt::check_hresult(pIWICFactory->CreateBitmapScaler(&pScaler));
  //
  //             winrt::check_hresult(
  //                 pScaler->Initialize(pSource.Get(), destinationWidth, destinationHeight, WICBitmapInterpolationModeCubic)
  //             );
  //
  //             winrt::check_hresult(
  //                 pConverter->Initialize(
  //                     pScaler.Get(),
  //                     GUID_WICPixelFormat32bppPBGRA,
  //                     WICBitmapDitherTypeNone,
  //                     nullptr,
  //                     0.f,
  //                     WICBitmapPaletteTypeMedianCut
  //                 )
  //             );
  //         } else {
  //             winrt::check_hresult(
  //                 pConverter->Initialize(
  //                     pSource.Get(),
  //                     GUID_WICPixelFormat32bppPBGRA,
  //                     WICBitmapDitherTypeNone,
  //                     nullptr,
  //                     0.f,
  //                     WICBitmapPaletteTypeMedianCut
  //                 )
  //             );
  //         }
  //
  //         // create a Direct2D bitmap from the WIC bitmap.
  //         winrt::check_hresult(pRenderTarget->CreateBitmapFromWicBitmap(pConverter.Get(), nullptr, ppBitmap));
  //
  //         return hr;
  //     };
  //
  // protected:
  //     using DXDisposer = std::function<void()>;
  //
  //     void addDisposer(const DXDisposer &disposer) {
  //         std::scoped_lock lock(disposalMutex_);
  //         if (!disposed_)
  //             disposers_.push_back(disposer);
  //     };
  //
  //     // Direct3D objects.
  //     // ComPtr<IDXGIFactory2> dxgiFactory_{nullptr};
  //     DXResTPtr(V, DGFactory) dgFactory_{nullptr};
  //     DXResTPtr(V, DGAdapter) dgAdapter_{nullptr};
  //     DXResTPtr(V, DGDevice) dgDevice_{nullptr};
  //     DXResT(V,DGAdapterLUID) dgAdapterLUID_{0};
  //
  //     DXResTPtr(V, Device) dev_{nullptr};
  //     DXResTPtr(V, DeviceContext) devContext_{nullptr};
  //     DXResTPtr(V, SwapChain) swapChain_{nullptr};
  //     DXResTPtr(V, RasterizerState) rasterizerState_{nullptr};
  //
  //     // Direct3D rendering objects. Required for 3D.
  //     DXResTPtr(V, Texture2D) renderTarget_{nullptr};
  //     DXResTPtr(V, Texture2D) depthStencil_{nullptr};
  //     DXResTPtr(V, RenderTargetView) renderTargetView_{nullptr};
  //     DXResTPtr(V, DepthStencilView) depthStencilView_{nullptr};
  //
  //     DXResT(V, Viewport) viewport_{};
  //
  //     ComPtr<IWICImagingFactory> wicFactory_{nullptr};
  //     //Direct2D
  //     ComPtr<ID2D1Factory> d2dFactory_{nullptr};
  //
  //     // Direct3D properties.
  //     DXGI_FORMAT backBufferFormat_{};
  //     DXGI_FORMAT depthBufferFormat_{};
  //     UINT backBufferCount_{};
  //
  //     // Cached device properties.
  //     D3D_FEATURE_LEVEL featureLevel_{};
  //     RECT outputSize_{}; // HDR Support
  //     DXGI_COLOR_SPACE_TYPE colorSpace_{};
  //
  //     // DeviceResources options (see flags above)
  //     unsigned int options_{0};
  //
  //     Size size_{0, 0};
  //
  // private:
  //     void disposeInternal_() {
  //         std::scoped_lock lock(disposalMutex_);
  //         if (disposed_.exchange(true)) {
  //             std::ranges::for_each(disposers_, [](auto &fn) { fn(); });
  //             disposers_.clear();
  //         }
  //     }
  //
  //     std::vector<DXDisposer> disposers_{};
  //     std::atomic_bool disposed_{false};
  //     std::mutex disposalMutex_{};
  //
  //     // The IDeviceNotify can be held directly as it owns the DeviceResources.
  //     DeviceListener *deviceNotify_{nullptr};
  // };
} // namespace IRacingTools::Shared::Graphics
