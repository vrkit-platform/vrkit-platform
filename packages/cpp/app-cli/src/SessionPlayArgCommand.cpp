//
// Created by jglanz on 4/19/2024.
//

#include "Dwmapi.h"

#include <spdlog/spdlog.h>
#include <SDL.h>
#include <SDL_syswm.h>

#include <SDL2pp/SDL.hh>
#include <SDL2pp/Window.hh>
#include <SDL2pp/Renderer.hh>
#include <SDL2pp/Texture.hh>

#include "SessionPlayArgCommand.h"
#include "IRacingTools/Shared/SharedMemoryStorage.h"
#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/DX11TrackMapResources.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>

namespace IRacingTools::App::Commands
{
  using namespace Shared;

  namespace UI
  {
    using namespace SDL2pp;

#define RGBA(r, g, b, a) r, g, b, a
    static const unsigned char pixels[4 * 4 * 4] = {
        RGBA(0xff, 0x00, 0x00, 0xff),
        RGBA(0xff, 0x80, 0x00, 0xff),
        RGBA(0xff, 0xff, 0x00, 0xff),
        RGBA(0x80, 0xff, 0x00, 0xff),
        RGBA(0xff, 0x00, 0x80, 0xff),
        RGBA(0xff, 0xff, 0xff, 0xff),
        RGBA(0x00, 0x00, 0x00, 0x00),
        RGBA(0x00, 0xff, 0x00, 0xff),
        RGBA(0xff, 0x00, 0xff, 0xff),
        RGBA(0x00, 0x00, 0x00, 0x00),
        RGBA(0x00, 0x00, 0x00, 0xff),
        RGBA(0x00, 0xff, 0x80, 0xff),
        RGBA(0x80, 0x00, 0xff, 0xff),
        RGBA(0x00, 0x00, 0xff, 0xff),
        RGBA(0x00, 0x80, 0xff, 0xff),
        RGBA(0x00, 0xff, 0xff, 0xff),
    };

    enum
    {
      MY_SPRITE_SIZE = 4, MY_SCREEN_WIDTH = 640, MY_SCREEN_HEIGHT = 480, MY_RENDER_TARGET_SIZE = 512,
    };

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

    const LPCWSTR ClassName = L"className";

    // this is the main message handler for the program
    LRESULT CALLBACK WindowProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
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

    class OverlayWindow
    {
    private:
      std::mutex mutex_{};
      std::atomic_bool running_{false};
      std::unique_ptr<std::thread> thread_{nullptr};
      // SDL sdl_{SDL_INIT_VIDEO};
      // Window window_;
      HWND window_{nullptr};

      std::shared_ptr<Graphics::DXResources> dxr_{nullptr};
      std::shared_ptr<Graphics::RenderTarget> renderTarget_{nullptr};
      std::shared_ptr<Graphics::DX11TrackMapResources> trackMapRenderer_{nullptr};

      // winrt::com_ptr<ID3D11RenderTargetView> renderTargetView_{nullptr};
      winrt::com_ptr<ID3D11Texture2D> backBuffer_{nullptr};
      winrt::com_ptr<IDXGISwapChain1> swapChain_{nullptr};
      Size<UINT> swapChainDim_{0, 0};

      //      Renderer renderer_;
      //      ID3D11Device * dev_;
      //      Texture sprite_;
      //      Texture target1_;
      //      Texture target2_;


    public:
      /**
       * @brief SDL2 window -> hWnd
       * @param win
       * @return
       */
      // static HWND GetNativeHandle(Window *win) {
      //   auto sdlWindow = win->Get();
      //
      //   SDL_SysWMinfo sdlInfo;
      //   SDL_VERSION(&sdlInfo.version);
      //   if (!SDL_GetWindowWMInfo(sdlWindow, &sdlInfo)) {
      //     spdlog::error("Error getting window: {}", SDL_GetError());
      //     return nullptr;
      //   }
      //   return sdlInfo.info.win.window;
      //
      // }

      OverlayWindow(OverlayWindow &&) = delete;

      OverlayWindow(const OverlayWindow &) = delete;

      OverlayWindow()
      {
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
            NULL,        // extended styles
            ClassName,    // name of the window class
            L"TestOverlay",   // title of the window
            WS_POPUP | WS_EX_TRANSPARENT | WS_EX_LAYERED,    // window style
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
        SetLayeredWindowAttributes(window_, 0, 0, LWA_ALPHA);
        //SetLayeredWindowAttributes(window_, RGB(0, 0, 0),0, LWA_COLORKEY);

        ShowWindow(window_, SW_SHOW);
        //UpdateWindow(window_);
        // MARGINS Margin = { -1, -1, -1, -1 };
        // DwmExtendFrameIntoClientArea(window_, &Margin);

        dxr_ = std::shared_ptr<Graphics::DXResources>(new Graphics::DXResources());
        // window_.SetOpacity(0.5f);
        // MakeWindowTransparent(window_.Get(), RGB(0, 0, 0));
        //MakeWindowTransparent(window_);
        // SetLayeredWindowAttributes(window_, RGB(0, 0, 0), 128, LWA_ALPHA);
        initializeSwapChain();
      }

      ~OverlayWindow()
      {
        stop();
      }


      void stop()
      {
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

      void start()
      {
        std::scoped_lock lock(mutex_);
        if (running_ || thread_)
          return;

        running_ = true;
        thread_ = std::make_unique<std::thread>(&OverlayWindow::runnable, this);

      }

      void join()
      {
        if (running_ && thread_ && thread_->joinable())
          thread_->join();

      }

      Size<UINT> getSize()
      {
        RECT rect;

        if (!window_ || !GetWindowRect(window_, &rect))
          return {};
        return {static_cast<UINT>(rect.right - rect.left), static_cast<UINT>(rect.bottom - rect.top)};
      }


      void runnable()
      {
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

              if (!trackMapRenderer_) {
                trackMapRenderer_ = std::make_shared<Graphics::DX11TrackMapResources>(dxr_);
              }

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


              trackMapRenderer_->render(renderTarget_);

              swapChain_->Present(1, 0);

            }
          }
        }


      };
    protected:

      void initializeSwapChain()
      {
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

            .BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT, .BufferCount = 3, .SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD, .AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED,
            .Flags = DXGI_SWAP_CHAIN_FLAG_FOREGROUND_LAYER,
        };
        // , .AlphaMode = DXGI_ALPHA_MODE_IGNORE

        DXGI_SWAP_CHAIN_FULLSCREEN_DESC swapChainFSDesc = {};
        swapChainFSDesc.Windowed = true;

        winrt::check_hresult(
            dxr_->getDXGIFactory()->CreateSwapChainForHwnd(
                dxr_->getDXGIDevice().get(), window_, &swapChainDesc, &swapChainFSDesc, nullptr, swapChain_.put()));

        winrt::check_hresult(swapChain_->GetBuffer(0, IID_PPV_ARGS(backBuffer_.put())));

        if (renderTarget_) {
          renderTarget_->setD3DTexture(backBuffer_);
        } else {
          renderTarget_ = Graphics::RenderTarget::Create(dxr_, backBuffer_);
        }
        //winrt::check_hresult(dxr_->getDXDevice()->CreateRenderTargetView(backBuffer_.get(),nullptr, renderTargetView_.put()));
      }


    };
  };


  CLI::App *SessionPlayArgCommand::createCommand(CLI::App *app)
  {

    auto cmd = app->add_subcommand("play", "Play Live Session");

    cmd->add_option("--telemetry", telemetryFilename_, "IBT Input file");
    cmd->add_option("--trackmap", trackmapFilename_, "Lap Trajectory File")->required(true);

    return cmd;
  }

  int SessionPlayArgCommand::execute()
  {
    spdlog::info("Loading track map ({})", trackmapFilename_);
    auto shm = IRacingTools::Shared::SharedMemoryStorage::GetInstance();
    winrt::check_bool(shm->loadTrackMapFromLapTrajectoryFile(trackmapFilename_));

    UI::OverlayWindow win;
    win.runnable();
    // win.start();
    //
    // win.join();
    //    std::cout << fmt::format("parsed filename: {}", filename_) << std::endl;
    //
    //
    //    auto diskClient = std::make_shared<DiskClient>(filename_);
    //    ClientManager::Get().add(filename_, diskClient);
    //
    //    std::cout << "Disk client opened " << filename_ << ": ready=" << diskClient->isFileOpen()
    //              << ",sampleCount=" << diskClient->getSampleCount() << std::endl;
    //    auto nowMillis = []() {
    //      return std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch());
    //    };
    //
    //    std::chrono::milliseconds previousSessionDuration{0};
    //    std::chrono::milliseconds previousTimeMillis = nowMillis();
    //    std::chrono::milliseconds lastPrintTime{0};
    //
    //    //std::shared_ptr<SessionInfo::SessionInfoMessage> info{nullptr};
    //    auto info = diskClient->getSessionInfo().lock();
    //    if (!info) {
    //      std::cerr << "No session info available" << std::endl;
    //      abort();
    //    }
    //
    //    auto &drivers = info->driverInfo.drivers;
    //
    //    while (diskClient->hasNext()) {
    //      if (!diskClient->next()) {
    //        std::cerr << "Unable to get next: " << diskClient->getSampleIndex() << "\n";
    //        break;
    //      }
    //
    //
    //      auto lat = diskClient->getVarFloat("Lat");
    //      auto lon = diskClient->getVarFloat("Lon");
    //      auto posCountRes = diskClient->getVarCount("CarIdxPosition");
    //      auto sessionTimeVal = diskClient->getVarDouble("SessionTime");
    //      if (!sessionTimeVal) {
    //        std::cerr << "No session time\n";
    //        abort();
    //      }
    //
    //      int posCount = 0;
    //      if (posCountRes) {
    //        for (auto &driver: drivers) {
    //          //for (std::size_t i = 0; i < posCountRes.value();i++) {
    //          std::size_t i = driver.carIdx;
    //
    //
    //          auto pos = diskClient->getVarInt("CarIdxPosition", i).value_or(-2);
    //          auto lap = diskClient->getVarInt("CarIdxLap", i).value_or(-2);
    //          auto surface = diskClient->getVarInt("CarIdxTrackSurface", i).value_or(-2);
    //          if (pos > 0 && !driver.isSpectator && driver.userID) {
    //            posCount++;
    //          } else if (pos > 0) {
    //            //breakpoint;
    //            std::cout << "Surface=" << surface << ",lap=" << lap << std::endl;
    //          }
    //        }
    //      }
    //
    //      auto sessionTime = sessionTimeVal.value();
    //      if (posCount) {
    //        std::cout << "Position count: " << posCount << std::endl;
    //      }
    //      //        long long int sessionMillis = std::floor(sessionTime * 1000.0);
    //      //        std::chrono::milliseconds sessionDuration{sessionMillis};
    //      //        long long int millis = sessionMillis % 1000;
    //      //        auto intervalDuration = sessionDuration - previousSessionDuration;
    //      //
    //      //        if (previousSessionDuration.count()) {
    //      //            auto currentTimeMillis = nowMillis();
    //      //
    //      //            if (posCount > 0 ) {
    //      //                auto targetTimeMillis = !previousTimeMillis.count() ? currentTimeMillis
    //      //                                                                    : (previousTimeMillis + intervalDuration);
    //      //                if (targetTimeMillis > currentTimeMillis) {
    //      //                    auto sleepTimeMillis = targetTimeMillis - currentTimeMillis;
    //      //                    std::this_thread::sleep_for(sleepTimeMillis);
    //      //                }
    //      //                previousTimeMillis = targetTimeMillis;
    //      //            } else {
    //      //                previousTimeMillis = currentTimeMillis;
    //      //            }
    //      //        }
    //      //
    //      //        previousSessionDuration = sessionDuration;
    //      //
    //      //        if (posCount > 0 && nowMillis() - lastPrintTime > 999ms) {
    //      //            std::cout << std::format(
    //      //                "Session Time: {:%H}:{:%M}:{:%S}.{:03d}\t\tCar Pos Count: {}", sessionDuration, sessionDuration, sessionDuration, millis,
    //      //                posCount
    //      //            ) << "\n";
    //      //            std::flush(std::cout);
    //      //            lastPrintTime = nowMillis();
    //      //        }
    //
    //      //        if (!lat || !lon) {
    //      //            std::cerr << "No lat or no lon \n";
    //      //            continue;
    //      //        }
    //      //
    //      //        std::cout << std::format("Coordinate\t\t{}\t{}\n",lat.value(),lon.value());
    //    }
    //
    //    //    auto& varHeaders = diskClient->getVarHeaders();
    //
    //    //    using RowType = std::tuple<std::string, std::size_t>;
    //
    //    //    auto varNames = std::accumulate(varHeaders.begin(),varHeaders.end(), std::list<RowType>{}, [&](std::list<RowType> rows, const VarDataHeader& header){
    //    //        rows.push_back(std::make_tuple(header.name, header.count));
    //    //        return rows;
    //    //    });
    //    //    std::array<std::string_view, 2> headers = {"Name", "Count"};
    //    //    PrintTabularData<2,std::string, std::size_t>(headers, varNames);
    //    //    auto shm = IRacingTools::Shared::SharedMemoryStorage::GetInstance();
    //    //    winrt::check_bool(shm->loadTrackMapFromLapTrajectoryFile(filename));
    return 0;
  }
}