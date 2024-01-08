//
// Created by jglanz on 1/7/2024.
//

#include <IRacingTools/Shared/Graphics/DXResourceProvider.h>
#include <IRacingTools/Shared/Macros.h>
#include <algorithm>
#include <cassert>

namespace IRacingTools::Shared::Graphics {

DX11WindowResourcesProvider::~DX11WindowResourcesProvider() {
  disposeInternal_();
}

DX11ResourceProvider::Device
DX11WindowResourcesProvider::getDevice() {
  return dev_;
}

DX11ResourceProvider::DeviceContext
DX11WindowResourcesProvider::getDeviceContext() {
  DeviceContext ctx;
  dev_->GetImmediateContext(&ctx);
  return ctx;
}

DX11ResourceProvider::SwapChain
DX11WindowResourcesProvider::getSwapChain() {
  return swapchain_;
}

DX11ResourceProvider::RasterizerState
DX11WindowResourcesProvider::getRasterizerState() {
  return rasterizerState_;
}

DX11WindowResourcesProvider::DX11WindowResourcesProvider(HWND windowHandle)
    : winHandle_(windowHandle) {
  HRESULT hr = S_OK;

  // create a struct to hold information about the swap chain
  DXGI_SWAP_CHAIN_DESC swapChainDesc;
  ZeroMemory(&swapChainDesc, sizeof(DXGI_SWAP_CHAIN_DESC));

  // fill the swap chain description struct
  RECT rcClient;
  GetClientRect(winHandle_, &rcClient);

  UINT width = abs(rcClient.right - rcClient.left);
  UINT height = abs(rcClient.bottom - rcClient.top);

  swapChainDesc.OutputWindow = winHandle_; // the window to be used
  swapChainDesc.BufferDesc.Width = width;
  swapChainDesc.BufferDesc.Height = height;
  swapChainDesc.BufferDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;

  swapChainDesc.BufferCount = 1; // one back buffer

  swapChainDesc.BufferUsage =
      DXGI_USAGE_RENDER_TARGET_OUTPUT; // how swap chain is to be used

  swapChainDesc.SampleDesc.Count = 4; // how many multisamples
  swapChainDesc.Windowed = TRUE;      // windowed/full-screen mode

  // create a device, device context and swap chain using the information in the
  // scd struct

  hr = D3D11CreateDeviceAndSwapChain(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
                                     0, nullptr, 0, D3D11_SDK_VERSION,
                                     &swapChainDesc, &swapchain_, &dev_,
                                     nullptr, &devContext_);

  AssertMsg(SUCCEEDED(hr), "Failed to create device & swap chain");

  D3D11_RASTERIZER_DESC rsDesc;
  rsDesc.AntialiasedLineEnable = FALSE;
  rsDesc.CullMode = D3D11_CULL_NONE;
  rsDesc.DepthBias = 0;
  rsDesc.DepthBiasClamp = 0;
  rsDesc.DepthClipEnable = TRUE;
  rsDesc.FillMode = D3D11_FILL_SOLID;
  rsDesc.FrontCounterClockwise = FALSE; // Must be FALSE for 10on9
  rsDesc.MultisampleEnable = FALSE;
  rsDesc.ScissorEnable = FALSE;
  rsDesc.SlopeScaledDepthBias = 0;

  hr = dev_->CreateRasterizerState(&rsDesc, &rasterizerState_);
  AssertMsg(SUCCEEDED(hr), "Failed to create rasterizer state");
}


void DX11WindowResourcesProvider::addDisposer(const DXDisposer &disposer) {
  std::scoped_lock lock(disposalMutex_);
  if (!disposed_)
    disposers_.push_back(disposer);
}

void DX11WindowResourcesProvider::disposeInternal_() {
  std::scoped_lock lock(disposalMutex_);
  if (disposed_.exchange(true)) {
    std::ranges::for_each(disposers_, [](auto &fn) { fn(); });
    disposers_.clear();
  }
}
} // namespace IRacingTools::Shared::Graphics