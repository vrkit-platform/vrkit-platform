//
// Created by jglanz on 5/1/2024.
//

#include <memory>

#include <IRacingTools/Shared/UI/OverlayWindow.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>


#include <spdlog/spdlog.h>

#include "Dwmapi.h"


namespace IRacingTools::Shared::UI
{

using namespace SDL2pp;

  // this is the main message handler for the program
  // LRESULT CALLBACK WindowProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

namespace
    {
  bool MakeWindowTransparent(HWND hWnd);

  int FindD3D11Driver(Window *window);
// #define RGBA(r, g, b, a) r, g, b, a
//     static const unsigned char pixels[4 * 4 * 4] = {
//         RGBA(0xff, 0x00, 0x00, 0xff),
//         RGBA(0xff, 0x80, 0x00, 0xff),
//         RGBA(0xff, 0xff, 0x00, 0xff),
//         RGBA(0x80, 0xff, 0x00, 0xff),
//         RGBA(0xff, 0x00, 0x80, 0xff),
//         RGBA(0xff, 0xff, 0xff, 0xff),
//         RGBA(0x00, 0x00, 0x00, 0x00),
//         RGBA(0x00, 0xff, 0x00, 0xff),
//         RGBA(0xff, 0x00, 0xff, 0xff),
//         RGBA(0x00, 0x00, 0x00, 0x00),
//         RGBA(0x00, 0x00, 0x00, 0xff),
//         RGBA(0x00, 0xff, 0x80, 0xff),
//         RGBA(0x80, 0x00, 0xff, 0xff),
//         RGBA(0x00, 0x00, 0xff, 0xff),
//         RGBA(0x00, 0x80, 0xff, 0xff),
//         RGBA(0x00, 0xff, 0xff, 0xff),
//     };
//
    enum
    {
      MY_SPRITE_SIZE = 4, MY_SCREEN_WIDTH = 640, MY_SCREEN_HEIGHT = 480, MY_RENDER_TARGET_SIZE = 512,
    };

    const LPCWSTR ClassName = L"className";

    bool MakeWindowTransparent(HWND hWnd)
    {
      // Get window handle (https://stackoverflow.com/a/24118145/3357935)
      // SDL_SysWMinfo wmInfo;
      // SDL_VERSION(&wmInfo.version);  // Initialize wmInfo
      // SDL_GetWindowWMInfo(window, &wmInfo);
      //  = wmInfo.info.win.window;

      // Change window type to layered (https://stackoverflow.com/a/3970218/3357935)
      SetWindowLong(hWnd, GWL_EXSTYLE, GetWindowLong(hWnd, GWL_EXSTYLE) | WS_EX_LAYERED);

      // Set transparency color
      //return SetLayeredWindowAttributes(hWnd, colorKey, 255, LWA_ALPHA);
      return SetLayeredWindowAttributes(hWnd, RGB(0, 0, 0), 128, LWA_ALPHA);

    }

    int FindD3D11Driver(Window *window)
    {
      SDL_Renderer *renderer = nullptr;
      for (int i = 0; i < SDL_GetNumRenderDrivers(); ++i) {
        SDL_RendererInfo rendererInfo = {};
        SDL_GetRenderDriverInfo(i, &rendererInfo);
        if (rendererInfo.name != std::string("direct3d11")) {
          continue;
        }

        //renderer = SDL_CreateRenderer(window->Get(), i, 0 );
        return i;
      }
      abort();
    }


  }
  static LRESULT WindowProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
  {
    switch (message) {
      case WM_DESTROY: {
        // close the application entirely
        PostQuitMessage(0);
        return 0;
      }
    }
    return DefWindowProc(hWnd, message, wParam, lParam);
  }

  HWND OverlayWindow::GetNativeHandle(Window *win) {
    auto sdlWindow = win->Get();

    SDL_SysWMinfo sdlInfo;
    SDL_VERSION(&sdlInfo.version);
    if (!SDL_GetWindowWMInfo(sdlWindow, &sdlInfo)) {
      spdlog::error("Error getting window: {}", SDL_GetError());
      return nullptr;
    }
    return sdlInfo.info.win.window;

  }

  OverlayWindow::OverlayWindow() {
    WNDCLASSEX wc;
    ZeroMemory(&wc, sizeof(WNDCLASSEX));

    // fill in the struct with the needed information
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW | CS_OWNDC;
    wc.lpfnWndProc = WindowProc;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH) 0;//COLOR_WINDOW;
    wc.lpszClassName = ClassName;
    wc.hInstance = GetModuleHandle(0);

    // register the window class
    RegisterClassEx(&wc);

    window_ = CreateWindowEx(
        WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_LAYERED,        // extended styles
        ClassName,    // name of the window class
        L"TestOverlay",   // title of the window
        WS_POPUP,    // window style
        0,    // x-position of the window
        0,    // y-position of the window
        400,    // width of the window
        400,    // height of the window
        NULL,    // we have no parent window, NULL
        NULL,    // we aren't using menus, NULL
        GetModuleHandle(0),    // application handle
        NULL
    );    // used with multiple windows, NULL

    // display the window on the screen
    //SetLayeredWindowAttributes(window_, 0, 0, LWA_ALPHA);
    //SetLayeredWindowAttributes(window_, RGB(0, 0, 0),0, LWA_COLORKEY);

    ShowWindow(window_, SW_SHOW);

    // MARGINS Margin = {-1, -1, -1, -1};
    // DwmExtendFrameIntoClientArea(window_, &Margin);

    dxr_ = std::make_shared<Graphics::DXResources>();
    initializeResources();
    initializeSwapChain();
  }

  OverlayWindow::~OverlayWindow() {
    stop();
  }

  void OverlayWindow::stop() {
    {
      std::scoped_lock lock(mutex_);
      if (!thread_)
        return;
    }

    running_ = false;
    //        thread_ = std::make_unique<std::thread>(&OverlayWindow::runnable, this);

    if (thread_->joinable())
      thread_->join();

    std::scoped_lock lock(mutex_);
    if (thread_)
      thread_.reset();
  }

  void OverlayWindow::start() {
    std::scoped_lock lock(mutex_);
    if (running_ || thread_)
      return;

    running_ = true;
    thread_ = std::make_unique<std::thread>(&OverlayWindow::runnable, this);

  }

  void OverlayWindow::join() {
    if (running_ && thread_ && thread_->joinable())
      thread_->join();

  }

  Size<UINT> OverlayWindow::getSize() {
    RECT rect;

    if (!window_ || !GetWindowRect(window_, &rect))
      return {};
    return {static_cast<UINT>(rect.right - rect.left), static_cast<UINT>(rect.bottom - rect.top)};
  }

  void OverlayWindow::runnable() {
    running_ = true;
    MSG msg;
    BOOL gotMessage;
    while (running_) {
      {
        if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
          TranslateMessage(&msg);
          DispatchMessage(&msg);

          if (msg.message == WM_QUIT)
            break;


          // Process input
          // if (msg.message != WM_PAINT)
          //   continue;


          auto dim = getSize();

          D3D11_VIEWPORT viewport = {};
          viewport.TopLeftX = 0;
          viewport.TopLeftY = 0;
          viewport.Width = static_cast<float>(dim.width());
          viewport.Height = static_cast<float>(dim.height());
          viewport.MinDepth = 0.0f;
          viewport.MaxDepth = 1.0f;


          // constexpr float clearColor[] = {1.0f, 1.0f, 1.0f, 1.0f};
          constexpr float clearColor[] = {1.0f, 1.0f, 1.0f, 1.0f};

          auto ctx = dxr_->getDXImmediateContext();
          auto rtv = renderTarget_->d3d().rtv();

          ctx->ClearRenderTargetView(
              rtv, DirectX::Colors::Transparent);
          // float color[4] = {0.0f, 0.0f, 0.0f, 0.0f};
          // ctx->ClearRenderTargetView(rtv, color);
          // ctx->ClearRenderTargetView(
          //     rtv, clearColor
          // );

          ctx->RSSetViewports(
              1, &viewport
          );

          ctx->OMSetRenderTargets(
              1, &rtv, nullptr
          );


          render(renderTarget_);

          swapChain_->Present(1, 0);

        }
      }
    }


  }

  void OverlayWindow::initializeResources() {
    check_hresult(
        DCompositionCreateDevice(dxr_->getDXGIDevice().get(), IID_PPV_ARGS(dComp_.put())));
    check_hresult(dComp_->CreateTargetForHwnd(window_, true, dCompTarget_.put()));
    check_hresult(dComp_->CreateVisual(dCompVisual_.put()));
  }

  void OverlayWindow::initializeSwapChain() {
    auto dim = getSize();
    if (dim == swapChainDim_) {
      spdlog::debug("Dimensions unchanged {},{}", dim.width(), dim.height());
      return;
    }

    swapChainDim_ = dim;

    // BufferCount = 3: triple-buffer to avoid stalls
    //
    // If the previous frame is still being Present()ed and we
    // only have two frames in the buffer, Present()ing the new
    // frame will stall until that has completed.
    //
    // We could avoid this by using frame pacing, but we want to decouple the
    // frame rates - if you're on a 30hz or 60hz monitor, OpenKneeboard should
    // still be able to push VR frames at 90hz
    //
    // So, triple-buffer
    DXGI_SWAP_CHAIN_DESC1 swapChainDesc{
        .Width = dim.width(),
        .Height = dim.height(),
        .Format = DXGI_FORMAT_B8G8R8A8_UNORM,
        .SampleDesc = {
            1, 0
        },
        .BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT,
        .BufferCount = 3,
        .SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD,
        .AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED,
        // .Flags = DXGI_SWAP_CHAIN_FLAG_FOREGROUND_LAYER,
    };

    DXGI_SWAP_CHAIN_FULLSCREEN_DESC swapChainFSDesc = {};
    swapChainFSDesc.Windowed = true;

    check_hresult(
        dxr_->getDXGIFactory()->CreateSwapChainForComposition(
            dxr_->getDXGIDevice().get(), &swapChainDesc, nullptr, swapChain_.put()));
    check_hresult(dCompVisual_->SetContent(swapChain_.get()));
    check_hresult(dCompTarget_->SetRoot(dCompVisual_.get()));
    check_hresult(dComp_->Commit());

    check_hresult(swapChain_->GetBuffer(0, IID_PPV_ARGS(backBuffer_.put())));

    if (renderTarget_) {
      renderTarget_->setD3DTexture(backBuffer_);
    } else {
      renderTarget_ = Graphics::RenderTarget::Create(dxr_, backBuffer_);
    }
    //winrt::check_hresult(dxr_->getDXDevice()->CreateRenderTargetView(backBuffer_.get(),nullptr, renderTargetView_.put()));
  }

}
