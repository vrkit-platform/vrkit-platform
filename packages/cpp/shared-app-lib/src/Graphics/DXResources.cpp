/*
 * OpenKneeboard
 *
 * Copyright (C) 2022 Fred Emmott <fred@fredemmott.com>
 *
 * This program is free software; you can redistribute it and/or
 * odify_ it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * eRCHANTABILITY_ or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for ore_ details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
 * USA.
 */

#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/SDK/Utils/ScopeHelpers.h>
#include <IRacingTools/Shared/Macros.h>

#include <spdlog/spdlog.h>

namespace IRacingTools::Shared::Graphics {

  using namespace IRacingTools::SDK::Utils;

  struct D3D11Resources::Locks {
    std::recursive_mutex mutex_;
  };

  struct D2DResources::Locks {
    std::mutex currentDrawMutex_;
    struct DrawInfo {
      // std::source_location location_;
      DWORD threadID_;
    };
    std::optional<DrawInfo> currentDraw_;
  };

  //using winrt::check_hresult;

  D3D11Resources::D3D11Resources() {
    UINT d3dFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
    auto d3dLevel = D3D_FEATURE_LEVEL_11_1;
    UINT dxgiFlags = 0;
#ifdef _DEBUG
    d3dFlags |= D3D11_CREATE_DEVICE_DEBUG;
    dxgiFlags |= DXGI_CREATE_FACTORY_DEBUG;
#endif

    check_hresult(
        CreateDXGIFactory2(dxgiFlags, IID_PPV_ARGS(dxgiFactory_.put())));

    winrt::com_ptr<IDXGIAdapter4> adapterIt;
    for (unsigned int i = 0; dxgiFactory_->EnumAdapterByGpuPreference(
        i, DXGI_GPU_PREFERENCE_HIGH_PERFORMANCE, IID_PPV_ARGS(adapterIt.put())) == S_OK; ++i) {
      const ScopedGuard releaseIt(
          [&]() {
            adapterIt = {nullptr};
          }
      );
      DXGI_ADAPTER_DESC1 desc{};
      adapterIt->GetDesc1(&desc);
      fmt::println(
          L"  GPU {} (LUID {:#x}): {:04x}:{:04x}: '{}' ({}mb) {}",
          i,
          std::bit_cast<uint64_t>(desc.AdapterLuid),
          desc.VendorId,
          desc.DeviceId,
          desc.Description,
          desc.DedicatedVideoMemory / (1024 * 1024),
          (desc.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) ? L" (software)" : L""
      );
      if (i == 0) {
        dxgiAdapter_ = adapterIt;
        static_assert(sizeof(uint64_t) == sizeof(desc.AdapterLuid));
        dxgiAdapterLUID_ = std::bit_cast<uint64_t>(desc.AdapterLuid);
      }

      D3DKMT_OPENADAPTERFROMLUID kmtAdapter{.AdapterLuid = desc.AdapterLuid};
      D3DKMTOpenAdapterFromLuid(&kmtAdapter);
      // winrt::check_nt(D3DKMTOpenAdapterFromLuid(&kmtAdapter));
      const ScopedGuard closeKMT(
          [&kmtAdapter]() noexcept {
            D3DKMT_CLOSEADAPTER closeAdapter{kmtAdapter.hAdapter};
            D3DKMTCloseAdapter(&closeAdapter);
            // winrt::check_nt(D3DKMTCloseAdapter(&closeAdapter));
          }
      );
      D3DKMT_WDDM_2_9_CAPS caps{};
      D3DKMT_QUERYADAPTERINFO capsQuery{.hAdapter = kmtAdapter.hAdapter, .Type = KMTQAITYPE_WDDM_2_9_CAPS, .pPrivateDriverData = &caps, .PrivateDriverDataSize = sizeof(caps),};
      if (D3DKMTQueryAdapterInfo(&capsQuery) != 0 /* STATUS_SUCCESS */) {
        D3DKMT_WDDM_2_7_CAPS caps{};
        capsQuery.Type = KMTQAITYPE_WDDM_2_7_CAPS;
        capsQuery.pPrivateDriverData = &caps;
        capsQuery.PrivateDriverDataSize = sizeof(caps);
        if (D3DKMTQueryAdapterInfo(&capsQuery) == 0) {
          if (caps.HwSchEnabled) {
            spdlog::debug("    HAGS: enabled");
          } else if (caps.HwSchEnabledByDefault) {
            spdlog::debug("    HAGS: anually_ disabled");
          } else if (caps.HwSchSupported) {
            spdlog::debug("    HAGS: disabled (supported but off-by-default)");
          } else {
            spdlog::debug("   HAGS: unsupported");
          }
        } else {
          spdlog::debug(
              "    HAGS: driver does not support WDDM 2.9 or 2.7 capabilities "
              "queries"
          );
        }
        continue;
      }

      switch (caps.HwSchSupportState) {
        case DXGK_FEATURE_SUPPORT_ALWAYS_OFF:
          spdlog::debug("    HAGS: not supported");
          break;
        case DXGK_FEATURE_SUPPORT_ALWAYS_ON:
          spdlog::debug("    HAGS: always on");
          break;
        case DXGK_FEATURE_SUPPORT_EXPERIMENTAL:
          spdlog::debug(
              "    HAGS: {} (experimental)", caps.HwSchEnabled ? "enabled" : "disabled"
          );
          break;
        case DXGK_FEATURE_SUPPORT_STABLE:
          spdlog::debug(
              "    HAGS: {} (stable)", caps.HwSchEnabled ? "enabled" : "disabled"
          );
          break;
      }
    }
    DISPLAY_DEVICEW displayDevice{.cb = sizeof(DISPLAY_DEVICEW)};
    for (DWORD i = 0; EnumDisplayDevicesW(nullptr, i, &displayDevice, 0); ++i) {
      if ((displayDevice.StateFlags & DISPLAY_DEVICE_ACTIVE) != DISPLAY_DEVICE_ACTIVE) {
        continue;
      }
      DEVMODEW deviceMode{.dmSize = sizeof(DEVMODEW)};
      EnumDisplaySettingsW(
          displayDevice.DeviceName, ENUM_CURRENT_SETTINGS, &deviceMode
      );
      fmt::println(
          L"  Monitor {} ('{}'): {}x{} @ {}hz",
          i,
          displayDevice.DeviceName,
          deviceMode.dmPelsWidth,
          deviceMode.dmPelsHeight,
          deviceMode.dmDisplayFrequency
      );
    }
    spdlog::debug("----------");

    winrt::com_ptr<ID3D11Device> d3d;
    winrt::com_ptr<ID3D11DeviceContext> d3dImmediateContext;
    check_hresult(
        D3D11CreateDevice(
            dxgiAdapter_.get(),
            // UNKNOWN is required when specifying an adapter
            D3D_DRIVER_TYPE_UNKNOWN,
            nullptr,
            d3dFlags,
            &d3dLevel,
            1,
            D3D11_SDK_VERSION,
            d3d.put(),
            nullptr,
            d3dImmediateContext.put()));
    dxDevice_ = d3d.as<ID3D11Device5>();
    dxImmediateContext_ = d3dImmediateContext.as<ID3D11DeviceContext4>();
    dxgiDevice_ = d3d.as<IDXGIDevice2>();
    d3d.as<ID3D11Multithread>()->SetMultithreadProtected(TRUE);
#ifdef DEBUG
    const auto iq = d3d.try_as<ID3D11InfoQueue>();
    if (iq) {
      iq->SetBreakOnSeverity(D3D11_MESSAGE_SEVERITY_WARNING, true);
      iq->SetBreakOnSeverity(D3D11_MESSAGE_SEVERITY_ERROR, true);
      iq->SetBreakOnSeverity(D3D11_MESSAGE_SEVERITY_CORRUPTION, true);
    }
#endif

    locks_ = std::make_unique<Locks>();
  }

  D3D11Resources::~D3D11Resources() = default;

  D2DResources::D2DResources(D3D11Resources *d3d) {
    D2D1_DEBUG_LEVEL d2dDebug = D2D1_DEBUG_LEVEL_NONE;
#ifdef DEBUG
    d2dDebug = D2D1_DEBUG_LEVEL_INFORMATION;
#endif
    D2D1_FACTORY_OPTIONS factoryOptions{.debugLevel = d2dDebug};

    check_hresult(
        D2D1CreateFactory(
            D2D1_FACTORY_TYPE_MULTI_THREADED, __uuidof(d2dFactory_), &factoryOptions, d2dFactory_.put_void()));

    check_hresult(
        d2dFactory_->CreateDevice(d3d->getDXGIDevice().get(), d2dDevice_.put()));

    winrt::com_ptr<ID2D1DeviceContext> ctx;
    check_hresult(
        d2dDevice_->CreateDeviceContext(
            D2D1_DEVICE_CONTEXT_OPTIONS_NONE, ctx.put()));
    d2dDeviceContext_ = ctx.as<ID2D1DeviceContext5>();
    ctx->SetUnitMode(D2D1_UNIT_MODE_PIXELS);
    // Subpixel antialiasing assumes text is aligned on pixel boundaries;
    // this isn't the case for OpenKneeboard
    ctx->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE);

    check_hresult(
        DWriteCreateFactory(
            DWRITE_FACTORY_TYPE_SHARED,
            __uuidof(IDWriteFactory),
            reinterpret_cast<IUnknown **>(directWriteFactory_.put())));

    locks_ = std::make_unique<Locks>();
  }

  D2DResources::~D2DResources() = default;

  DXResources::DXResources() : D3D11Resources(), D2DResources(this) {
    Microsoft::WRL::ComPtr<ID2D1DeviceContext> d2dBackBufferContext;
    check_hresult(
        d2dDevice_->CreateDeviceContext(
            D2D1_DEVICE_CONTEXT_OPTIONS_NONE, &d2dBackBufferContext
        ));
    d2dBackBufferContext.As(&s2sBackBufferDeviceContext_);
    d2dBackBufferContext->SetUnitMode(D2D1_UNIT_MODE_PIXELS);
    d2dBackBufferContext->SetTextAntialiasMode(
        D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE
    );

    spriteBatch_ = std::make_unique<SpriteBatch>(dxDevice_.get());

    //wicImagingFactory_ = winrt::create_instance<IWICImagingFactory>(CLSID_WICImagingFactory);

    // check_hresult(PdfCreateRenderer(dXGIDevice_.get(), pDFRenderer_.put()));

    check_hresult(
        d2dDeviceContext_->CreateSolidColorBrush(
            D2D1::ColorF(1.0f, 1.0f, 1.0f, 1.0f), whiteBrush_.put()));
    check_hresult(
        d2dDeviceContext_->CreateSolidColorBrush(
            D2D1::ColorF(0.0f, 0.8f, 1.0f, 1.0f), highlightBrush_.put()));
    check_hresult(
        d2dDeviceContext_->CreateSolidColorBrush(
            D2D1::ColorF(0.0f, 0.0f, 0.0f, 1.0f), blackBrush_.put()));
    check_hresult(
        d2dDeviceContext_->CreateSolidColorBrush(
            D2D1::ColorF(1.0f, 0.0f, 1.0f, 0.0f), eraserBrush_.put()));

    d2dDeviceContext_->CreateSolidColorBrush(
        {0.0f, 0.0f, 0.0f, 0.8f},
        D2D1::BrushProperties(),
        reinterpret_cast<ID2D1SolidColorBrush **>(cursorInnerBrush_.put()));
    d2dDeviceContext_->CreateSolidColorBrush(
        {1.0f, 1.0f, 1.0f, 0.8f},
        D2D1::BrushProperties(),
        reinterpret_cast<ID2D1SolidColorBrush **>(cursorOuterBrush_.put()));
  }


  // winrt::com_ptr<IWICImagingFactory> &DXResources::getWICImagingFactory() { return wicImagingFactory_; }

  winrt::com_ptr<ID2D1SolidColorBrush> &DXResources::getWhiteBrush() { return whiteBrush_; }

  winrt::com_ptr<ID2D1SolidColorBrush> &DXResources::getHighlightBrush() { return highlightBrush_; }

  winrt::com_ptr<ID2D1SolidColorBrush> &DXResources::getBlackBrush() { return blackBrush_; }

  winrt::com_ptr<ID2D1SolidColorBrush> &DXResources::getEraserBrush() { return eraserBrush_; }

  winrt::com_ptr<ID2D1SolidColorBrush> &DXResources::getCursorInnerBrush() { return cursorInnerBrush_; }

  winrt::com_ptr<ID2D1SolidColorBrush> &DXResources::getCursorOuterBrush() { return cursorOuterBrush_; }

  void D2DResources::pushD2DDraw() {
    {
      std::unique_lock lock(locks_->currentDrawMutex_);
      if (locks_->currentDraw_) {
        const auto &prev = *locks_->currentDraw_;
        spdlog::debug("Starting a D2D draw while one already in progress:");
        // spdlog::debug("First: {} (thread ID {})", prev.location_, GetCurrentThreadId());
        // spdlog::debug("Second: {} (thread ID {})", loc, prev.threadID_);
        // OPENKNEEBOARD_BREAK;
        IRT_BREAK;
      } else {
        locks_->currentDraw_ = {GetCurrentThreadId()};
      }
    }
    d2dDeviceContext_->BeginDraw();
  }

  HRESULT D2DResources::popD2DDraw() {
    {
      std::unique_lock lock(locks_->currentDrawMutex_);
      if (!locks_->currentDraw_) {
        IRT_BREAK;
      }
      locks_->currentDraw_ = {};
    }
    const auto result = d2dDeviceContext_->EndDraw();
    if (result != S_OK) [[unlikely]] {
      IRT_BREAK;
    }
    return result;
  }

  winrt::com_ptr<ID2D1Factory1> &D2DResources::getD2DFactory() {
    return d2dFactory_;
  }

  winrt::com_ptr<ID2D1Device> &D2DResources::getD2DDevice() {
    return d2dDevice_;
  }

  winrt::com_ptr<ID2D1DeviceContext5> &D2DResources::getD2DDeviceContext() {
    return d2dDeviceContext_;
  }

  winrt::com_ptr<IDWriteFactory> &D2DResources::getDirectWriteFactory() {
    return directWriteFactory_;
  }

  void D3D11Resources::lock() {
    // OPENKNEEBOARD_TraceLoggingScope("D3D11Resources::lock()");

    // If we've locked D2D, we don't need to separately lock D3D; keeping it
    // here anyway as:
    // - might_ as well check it's in multithreaded_ ode_ in debug builds
    // - keep it in the API :)

    // If we have just a D2D lock, attempting to acquire a second can lead to
    // an error inside D2D when it tries to acquire the lock in D3D but it's
    // already active

    // In the end, we use an std::recursive_mutex anyway:
    // - it's sufficient
    // - it avoids interferring with XAML, or the WinRT PDF renderer
    locks_->mutex_.lock();
  }

  void D3D11Resources::unlock() {
    // OPENKNEEBOARD_TraceLoggingScope("D3D11Resources::unlock()");
    locks_->mutex_.unlock();
  }

  bool D3D11Resources::try_lock() {
    // OPENKNEEBOARD_TraceLoggingScope("D3D11Resources::try_lock()");
    return locks_->mutex_.try_lock();
  }

  winrt::com_ptr<IDXGIFactory6> &D3D11Resources::getDXGIFactory() { return dxgiFactory_; }

  winrt::com_ptr<IDXGIAdapter4> &D3D11Resources::getDXGIAdapter() { return dxgiAdapter_; }

  uint64_t D3D11Resources::getDXGIAdapterLUID() {
    return dxgiAdapterLUID_;
  }

  winrt::com_ptr<ID3D11Device5> &D3D11Resources::getDXDevice() { return dxDevice_; }

  winrt::com_ptr<ID3D11DeviceContext4> &D3D11Resources::getDXImmediateContext() { return dxImmediateContext_; }

  winrt::com_ptr<IDXGIDevice2> &D3D11Resources::getDXGIDevice() { return dxgiDevice_; }

};// namespace OpenKneeboard
