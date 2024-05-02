//
// Created by jglanz on 5/1/2024.
//

#pragma once

#include <Dwmapi.h>

#include <SDL2pp/Texture.hh>
#include <SDL2pp/Renderer.hh>
#include <SDL2pp/Window.hh>
#include <SDL2pp/SDL.hh>
#include <SDL_syswm.h>
#include <SDL.h>
#include <spdlog/spdlog.h>

#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/DX11TrackMapWidget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

namespace IRacingTools::Shared::UI {

  using namespace SDL2pp;

class OverlayWindow
{
private:
  std::mutex mutex_{};
  std::atomic_bool running_{false};
  std::unique_ptr<std::thread> thread_{nullptr};

protected:
  winrt::com_ptr<IDCompositionDevice> dComp_{};
  winrt::com_ptr<IDCompositionTarget> dCompTarget_{};
  winrt::com_ptr<IDCompositionVisual> dCompVisual_{};

  HWND window_{nullptr};
  std::shared_ptr<Graphics::DXResources> dxr_{nullptr};
  std::shared_ptr<Graphics::RenderTarget> renderTarget_{nullptr};

  winrt::com_ptr<ID3D11Texture2D> backBuffer_{nullptr};
  winrt::com_ptr<IDXGISwapChain1> swapChain_{nullptr};
  Size<UINT> swapChainDim_{0, 0};

public:

  static HWND GetNativeHandle(Window *win);
  /**
   * @brief SDL2 window -> hWnd
   * @param win
   * @return
   */

  OverlayWindow(OverlayWindow &&) = delete;

  OverlayWindow(const OverlayWindow &) = delete;

  OverlayWindow();

  ~OverlayWindow();


  void stop();

  void start();

  void join();

  Size<UINT> getSize();

  void runnable();

  virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) = 0;

protected:
  void initializeResources();

  void initializeSwapChain();


};
};
