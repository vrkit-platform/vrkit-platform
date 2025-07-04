#pragma once


#include <IRacingSDK/Utils/LockHelpers.h>

#include "../SharedAppLibPCH.h"
#include "DX113D.h"


namespace VRKit::Shared::Graphics {

  struct DeviceListener {
    virtual void onDeviceLost() = 0;

    virtual void onDeviceRestored() = 0;

    virtual ~DeviceListener() = default;
  };


  /**
   * Resources needed for anything in OpenKneeboard using D3D11.
   *
   * This includes:
   * - the main app
   * - the SteamVR implementation (which uses its' own devices)
   * - the viewer
   */
  class D3D11Resources : public IRacingSDK::Utils::Lockable {
    protected:

      D3D11Resources();


      winrt::com_ptr<IDXGIFactory6> dxgiFactory_;
      winrt::com_ptr<IDXGIAdapter4> dxgiAdapter_;
      uint64_t dxgiAdapterLUID_;

      winrt::com_ptr<ID3D11Device5> dxDevice_;
      winrt::com_ptr<ID3D11DeviceContext4> dxImmediateContext_;

      winrt::com_ptr<IDXGIDevice2> dxgiDevice_;

    public:

      virtual ~D3D11Resources();

      D3D11Resources(const D3D11Resources&) = delete;

      D3D11Resources& operator=(const D3D11Resources&) = delete;

      winrt::com_ptr<IDXGIFactory6>& getDXGIFactory();

      winrt::com_ptr<IDXGIAdapter4>& getDXGIAdapter();

      uint64_t getDXGIAdapterLUID();

      winrt::com_ptr<ID3D11Device5>& getDXDevice();

      winrt::com_ptr<ID3D11DeviceContext4>& getDXImmediateContext();

      winrt::com_ptr<IDXGIDevice2>& getDXGIDevice();

      void lock() override;

      bool try_lock() override;

      void unlock() override;

    private:

      struct Locks;
      std::unique_ptr<Locks> locks_;
  };

  /**
   * Additional resources needed for Direct2D + DirectWrite.
   *
   * I've included DirectWrite here for now as it's the only current
   * reason for using Direct2D.
   *
   * D3D should be preferred in new code for basic primitives.
   */
  class D2DResources {

    public:

      D2DResources() = delete;

      D2DResources(const D2DResources&) = delete;

      ~D2DResources();

    protected:

      explicit D2DResources(D3D11Resources*);

      D2DResources& operator=(const D2DResources&) = delete;

      winrt::com_ptr<ID2D1Factory1> d2dFactory_;

      winrt::com_ptr<ID2D1Device> d2dDevice_;
      winrt::com_ptr<ID2D1DeviceContext5> d2dDeviceContext_;

      winrt::com_ptr<IDWriteFactory> directWriteFactory_;

    public:

      // Use like push/pop, but only one is allowed at a time; this exists
      // to get better debugging information/breakpoints when that's not the case
      void pushD2DDraw();

      HRESULT popD2DDraw();


      winrt::com_ptr<ID2D1Factory1>& getD2DFactory();

      winrt::com_ptr<ID2D1Device>& getD2DDevice();

      winrt::com_ptr<ID2D1DeviceContext5>& getD2DDeviceContext();

      winrt::com_ptr<IDWriteFactory>& getDirectWriteFactory();

    private:

      struct Locks;
      std::unique_ptr<Locks> locks_;
  };

  /// Resources for the OpenKneeboard app
  class DXResources : public D3D11Resources, public D2DResources {
    public:

      DXResources();

      DXResources(const DXResources&) = delete;

      DXResources(DXResources&&) = delete;

      DXResources& operator=(const DXResources&) = delete;

      DXResources& operator=(DXResources&&) = delete;


      // winrt::com_ptr<IWICImagingFactory> &getWICImagingFactory();

      // Brushes :)

      // Would like something more semantic for this one; used for:
      // - PDF background
      winrt::com_ptr<ID2D1SolidColorBrush>& getWhiteBrush();

      // - PDF links
      // - Button mouseovers
      winrt::com_ptr<ID2D1SolidColorBrush>& getHighlightBrush();

      //-  Doodle pen
      winrt::com_ptr<ID2D1SolidColorBrush>& getBlackBrush();

      //-  Doodle eraser
      winrt::com_ptr<ID2D1SolidColorBrush>& getEraserBrush();

      winrt::com_ptr<ID2D1SolidColorBrush>& getCursorInnerBrush();

      winrt::com_ptr<ID2D1SolidColorBrush>& getCursorOuterBrush();

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

} // namespace VRKit::Shared::Graphics
