//
// Created by jglanz on 1/7/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"

#include <atomic>
#include <functional>
#include <mutex>

namespace IRacingTools::Shared::Graphics {

using Microsoft::WRL::ComPtr;

enum class DXResourceProviderType {
  DX11,
  DX12
};

template<DXResourceProviderType type> struct DxResourceProviderConfig {};
template<> struct DxResourceProviderConfig<DXResourceProviderType::DX11> {
  using DeviceType = ID3D11Device;
  using DeviceContextType = ID3D11DeviceContext;
  using SwapChainType = IDXGISwapChain;
  using RasterizerStateType = ID3D11RasterizerState;
  using RenderTargetViewType = ID3D11RenderTargetView;

  using RenderTarget2DType = ID2D1RenderTarget;
  using Texture2DType = ID3D11Texture2D;

  using DepthStenciViewType = ID3D11DepthStencilView;
};

template<DXResourceProviderType Type>
class DXResourceProvider {

public:
  using Config = DxResourceProviderConfig<Type>;
  using Device = ComPtr<typename Config::DeviceType>;
  using DeviceContext = ComPtr<typename Config::DeviceContextType>;
  using SwapChain = ComPtr<typename Config::SwapChainType>;
  using RasterizerState = ComPtr<typename Config::RasterizerStateType>;

  using RenderTargetView = ComPtr<typename Config::RenderTargetViewType>;
  using RenderTarget2D = ComPtr<typename Config::RenderTarget2DType>;

  using Texture2D = ComPtr<typename Config::Texture2DType>;
  using DepthStencilView = ComPtr<typename Config::DepthStenciViewType>;;

  // function prototypes
  virtual ~DXResourceProvider() = default;

  virtual Device getDevice() = 0;
  virtual DeviceContext getDeviceContext() = 0;
  virtual SwapChain getSwapChain() = 0;
  virtual RasterizerState getRasterizerState() = 0;
  // virtual RenderTargetView getRenderTargetView() =0;

  // virtual RenderTarget2D getRenderTarget() =0;
  // virtual Texture2D getDepthStencil() =0;
  // virtual DepthStencilView getDepthStencilView() =0;
  // virtual Texture2D getOffscreenTexture() =0;
};

using DX11ResourceProvider = DXResourceProvider<DXResourceProviderType::DX11>;

class DX11WindowResourcesProvider : public DX11ResourceProvider {
public:

  explicit DX11WindowResourcesProvider(HWND windowHandle);

  ~DX11WindowResourcesProvider() override;
  Device getDevice() override;
  DeviceContext getDeviceContext() override;
  SwapChain getSwapChain() override;
  RasterizerState getRasterizerState() override;


protected:
  using DXDisposer = std::function<void()>;

  void addDisposer(const DXDisposer &disposer);

private:
  std::vector<DXDisposer> disposers_{};
  void disposeInternal_();

  std::atomic_bool disposed_{false};
  std::mutex disposalMutex_{};

  RasterizerState rasterizerState_;
  SwapChain swapchain_{nullptr};
  Device dev_{nullptr};
  DeviceContext devContext_{nullptr};

  HWND winHandle_;
};

} // namespace IRacingTools::Shared::Graphics
