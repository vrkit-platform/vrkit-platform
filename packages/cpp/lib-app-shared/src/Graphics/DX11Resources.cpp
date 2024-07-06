//
// Created by jglanz on 1/7/2024.
//

#include <cassert>
#include <fmt/xchar.h>
#include <fmt/core.h>

#include <IRacingTools/Shared/Graphics/DX11Resources.h>
#include <IRacingTools/Shared/Macros.h>

#include "IRacingTools/SDK/Utils/ScopeHelpers.h"
#include "spdlog/spdlog.h"


namespace IRacingTools::Shared::Graphics {

//   DX11WindowResources::DX11WindowResources(HWND windowHandle) : winHandle_(windowHandle) {
//     createD3DResources();
//     createDeviceIndependentResources();
//   }
//
//   HRESULT DX11WindowResources::createDeviceIndependentResources() {
//     createD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);
//
//     AOK(CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_IWICImagingFactory, &wicFactory_));
//     return S_OK;
//   }
//
//   HRESULT DX11WindowResources::createD3DResources() {
//     HRESULT hr = S_OK;
//
//     UINT d3dFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
//     D3D_FEATURE_LEVEL d3dLevel = D3D_FEATURE_LEVEL_11_1;
//     UINT dxgiFlags = 0;
// #ifdef DEBUG
//     d3dFlags |= D3D11_CREATE_DEVICE_DEBUG;
//     dxgiFlags |= DXGI_CREATE_FACTORY_DEBUG;
// #endif
//
//     winrt::check_hresult(
//         CreateDXGIFactory2(dxgiFlags, IID_PPV_ARGS(&dgFactory_)));
//
//     ComPtr<IDXGIAdapter4> adapterIt;
//     for (unsigned int i = 0;
//          dgFactory_->EnumAdapterByGpuPreference(
//              i, DXGI_GPU_PREFERENCE_HIGH_PERFORMANCE, IID_PPV_ARGS(&adapterIt))
//          == S_OK;
//          ++i) {
//       const SDK::Utils::ScopedGuard releaseIt([&]() { adapterIt = {nullptr}; });
//       DXGI_ADAPTER_DESC1 desc {};
//       adapterIt->GetDesc1(&desc);
//       fmt::println(
//           L"  GPU {} (LUID {:#x}): {:04x}:{:04x}: '{}' ({}mb) {}",
//           i,
//           std::bit_cast<uint64_t>(desc.AdapterLuid),
//           desc.VendorId,
//           desc.DeviceId,
//           desc.Description,
//           desc.DedicatedVideoMemory / (1024 * 1024),
//           (desc.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) ? L" (software)" : L"");
//       if (i == 0) {
//         dgAdapter_ = adapterIt;
//         static_assert(sizeof(uint64_t) == sizeof(desc.AdapterLuid));
//         dgAdapterLUID_ = std::bit_cast<uint64_t>(desc.AdapterLuid);
//       }
//
//       D3DKMT_OPENADAPTERFROMLUID kmtAdapter {.AdapterLuid = desc.AdapterLuid};
//       winrt::check_nt(D3DKMTOpenAdapterFromLuid(&kmtAdapter));
//       const SDK::Utils::ScopedGuard closeKMT([&kmtAdapter]() noexcept {
//         D3DKMT_CLOSEADAPTER closeAdapter {kmtAdapter.hAdapter};
//         winrt::check_nt(D3DKMTCloseAdapter(&closeAdapter));
//       });
//       D3DKMT_WDDM_2_9_CAPS caps {};
//       D3DKMT_QUERYADAPTERINFO capsQuery {
//           .hAdapter = kmtAdapter.hAdapter,
//           .Type = KMTQAITYPE_WDDM_2_9_CAPS,
//           .pPrivateDriverData = &caps,
//           .PrivateDriverDataSize = sizeof(caps),
//       };
//       if (D3DKMTQueryAdapterInfo(&capsQuery) != 0 /* STATUS_SUCCESS */) {
//         D3DKMT_WDDM_2_7_CAPS caps {};
//         capsQuery.Type = KMTQAITYPE_WDDM_2_7_CAPS;
//         capsQuery.pPrivateDriverData = &caps;
//         capsQuery.PrivateDriverDataSize = sizeof(caps);
//         if (D3DKMTQueryAdapterInfo(&capsQuery) == 0) {
//           if (caps.HwSchEnabled) {
//             spdlog::debug("    HAGS: enabled");
//           } else if (caps.HwSchEnabledByDefault) {
//             spdlog::debug("    HAGS: manually disabled");
//           } else if (caps.HwSchSupported) {
//             spdlog::debug("    HAGS: disabled (supported but off-by-default)");
//           } else {
//             spdlog::debug("   HAGS: unsupported");
//           }
//         } else {
//           spdlog::debug(
//               "    HAGS: driver does not support WDDM 2.9 or 2.7 capabilities "
//               "queries");
//         }
//         continue;
//       }
//
//       switch (caps.HwSchSupportState) {
//         case DXGK_FEATURE_SUPPORT_ALWAYS_OFF:
//           spdlog::debug("    HAGS: not supported");
//           break;
//         case DXGK_FEATURE_SUPPORT_ALWAYS_ON:
//           spdlog::debug("    HAGS: always on");
//           break;
//         case DXGK_FEATURE_SUPPORT_EXPERIMENTAL:
//           spdlog::debug(
//               "    HAGS: {} (experimental)",
//               caps.HwSchEnabled ? "enabled" : "disabled");
//           break;
//         case DXGK_FEATURE_SUPPORT_STABLE:
//           spdlog::debug(
//               "    HAGS: {} (stable)", caps.HwSchEnabled ? "enabled" : "disabled");
//           break;
//       }
//     }
//
//     // create a struct to hold information about the swap chain
//     DXGI_SWAP_CHAIN_DESC swapChainDesc;
//     ZeroMemory(&swapChainDesc, sizeof(DXGI_SWAP_CHAIN_DESC));
//
//     auto [width, height] = updateSize();
//
//     swapChainDesc.OutputWindow = winHandle_; // the window to be used
//     swapChainDesc.BufferDesc.Width = width;
//     swapChainDesc.BufferDesc.Height = height;
//     swapChainDesc.BufferDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
//     swapChainDesc.BufferDesc.RefreshRate.Numerator = 60;
//     swapChainDesc.BufferDesc.RefreshRate.Denominator = 1;
//     swapChainDesc.BufferCount = 2; // one back buffer
//     swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT; // how swap chain is to be used
//
//     swapChainDesc.SampleDesc.Count = 1;
//     swapChainDesc.SampleDesc.Quality = 0;
//
//     swapChainDesc.SwapEffect = DXGI_SWAP_EFFECT_DISCARD;
//     // swapChainDesc.SampleDesc.Count = 4; // how many multisamples
//     swapChainDesc.Windowed = TRUE; // windowed/full-screen mode
//
//     // create a device, device context and swap chain using the information in the
//     // scd struct
//     UINT creationFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
// #if defined(_DEBUG)
//     // If the project is in a debug build, enable the debug layer.
//     creationFlags |= D3D11_CREATE_DEVICE_DEBUG;
// #endif
//     ComPtr<ID3D11Device> dev;
//     ComPtr<ID3D11DeviceContext> devContext;
//     hr = D3D11CreateDeviceAndSwapChain(
//         nullptr,
//         D3D_DRIVER_TYPE_HARDWARE,
//         nullptr,
//         creationFlags,
//         &d3dLevel,
//         0,
//         D3D11_SDK_VERSION,
//         &swapChainDesc,
//         &swapChain_,
//         &dev,
//         nullptr,
//         &devContext
//     );
//
//     winrt::check_hresult(hr);
//     winrt::check_hresult(dev.As(&dev_));
//     winrt::check_hresult(devContext.As(&devContext_));
//
// #ifdef DEBUG
//     ComPtr<ID3D11InfoQueue> iq;
//     winrt::check_hresult(dev_.As(&iq));
//     if (iq) {
//       iq->SetBreakOnSeverity(D3D11_MESSAGE_SEVERITY_WARNING, true);
//       iq->SetBreakOnSeverity(D3D11_MESSAGE_SEVERITY_ERROR, true);
//       iq->SetBreakOnSeverity(D3D11_MESSAGE_SEVERITY_CORRUPTION, true);
//     }
// #endif
//
//     D3D11_RASTERIZER_DESC rsDesc;
//     rsDesc.AntialiasedLineEnable = FALSE;
//     rsDesc.CullMode = D3D11_CULL_NONE;
//     rsDesc.DepthBias = 0;
//     rsDesc.DepthBiasClamp = 0;
//     rsDesc.DepthClipEnable = TRUE;
//     rsDesc.FillMode = D3D11_FILL_SOLID;
//     rsDesc.FrontCounterClockwise = FALSE; // Must be FALSE for 10on9
//     rsDesc.MultisampleEnable = FALSE;
//     rsDesc.ScissorEnable = FALSE;
//     rsDesc.SlopeScaledDepthBias = 0;
//
//     hr = dev_->CreateRasterizerState(&rsDesc, &rasterizerState_);
//     winrt::check_hresult(hr);
//
//     devContext_->RSSetState(rasterizerState_.Get());
//     devContext_->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
//
//     return hr;
//   }
//
//
//   Size DX11WindowResources::updateSize(std::optional<Size> newSize) {
//     if (newSize) {
//       size_ = newSize.value();
//
//     } else {
//       // fill the swap chain description struct
//       RECT rcClient;
//       GetClientRect(winHandle_, &rcClient);
//
//       UINT width = abs(rcClient.right - rcClient.left);
//       UINT height = abs(rcClient.bottom - rcClient.top);
//
//       size_ = {width, height};
//     }
//     return size_;
//   }
//
//   HRESULT DX11WindowResources::createD3DSizedResources() {
//     return S_OK;
//   }
//
//   HRESULT DX11WindowResources::createD2DResources() {
//     return S_OK;
//   }

} // namespace IRacingTools::Shared::Graphics