//
// Created by jglanz on 4/19/2024.
//

#include "SessionPlayArgCommand.h"
#include <SDL.h>

#include <SDL2pp/SDL.hh>
#include <SDL2pp/Window.hh>
#include <SDL2pp/Renderer.hh>
#include <SDL2pp/Texture.hh>

namespace IRacingTools::App::Shared::Utils {

  namespace UI {
    using namespace SDL2pp;

#define RGBA(r, g, b, a) r, g, b, a
    static const unsigned char pixels[4 * 4 * 4] = {
        RGBA(0xff, 0x00, 0x00, 0xff), RGBA(0xff, 0x80, 0x00, 0xff), RGBA(0xff, 0xff, 0x00, 0xff), RGBA(0x80, 0xff, 0x00, 0xff),
        RGBA(0xff, 0x00, 0x80, 0xff), RGBA(0xff, 0xff, 0xff, 0xff), RGBA(0x00, 0x00, 0x00, 0x00), RGBA(0x00, 0xff, 0x00, 0xff),
        RGBA(0xff, 0x00, 0xff, 0xff), RGBA(0x00, 0x00, 0x00, 0x00), RGBA(0x00, 0x00, 0x00, 0xff), RGBA(0x00, 0xff, 0x80, 0xff),
        RGBA(0x80, 0x00, 0xff, 0xff), RGBA(0x00, 0x00, 0xff, 0xff), RGBA(0x00, 0x80, 0xff, 0xff), RGBA(0x00, 0xff, 0xff, 0xff),
    };

    enum {
      MY_SPRITE_SIZE = 4,
      MY_SCREEN_WIDTH = 640,
      MY_SCREEN_HEIGHT = 480,
      MY_RENDER_TARGET_SIZE = 512,
    };

    int findD3D11Driver(Window * window) {
      SDL_Renderer* renderer = nullptr;
      for( int i = 0; i < SDL_GetNumRenderDrivers(); ++i )
      {
        SDL_RendererInfo rendererInfo = {};
        SDL_GetRenderDriverInfo( i, &rendererInfo );
        if( rendererInfo.name != std::string( "direct3d11" ) )
        {
          continue;
        }

        //renderer = SDL_CreateRenderer(window->Get(), i, 0 );
        return i;
      }
      abort();
    }

    class OverlayWindow {
    private:
      std::mutex mutex_{};
      std::atomic_bool running_{false};
      std::unique_ptr<std::thread> thread_{nullptr};
      SDL sdl_{SDL_INIT_VIDEO};
      Window window_;
      Renderer renderer_;
      ID3D11Device * dev_;
      Texture sprite_;
      Texture target1_;
      Texture target2_;


    public:
      OverlayWindow(OverlayWindow&&) = delete;
      OverlayWindow(const OverlayWindow&) = delete;
      OverlayWindow()
          : window_("libSDL2pp demo: sprites", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, MY_SCREEN_WIDTH,
                    MY_SCREEN_HEIGHT, SDL_WINDOW_RESIZABLE),
            renderer_(window_, findD3D11Driver(&window_), SDL_RENDERER_ACCELERATED | SDL_RENDERER_TARGETTEXTURE ),
            dev_(SDL_RenderGetD3D11Device(renderer_.Get())),

            // Sprite data
            sprite_(renderer_, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STATIC, MY_SPRITE_SIZE, MY_SPRITE_SIZE),
            target1_(renderer_, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_TARGET, MY_RENDER_TARGET_SIZE,
                     MY_RENDER_TARGET_SIZE),
            target2_(renderer_, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_TARGET, MY_RENDER_TARGET_SIZE,
                     MY_RENDER_TARGET_SIZE) {

        renderer_.SetDrawBlendMode(SDL_BLENDMODE_BLEND);

        // Necessary checks according to SDL docs
        SDL_RendererInfo ri;
        renderer_.GetInfo(ri);

        if (!(ri.flags & SDL_RENDERER_TARGETTEXTURE)) {
          std::cerr << "Sorry, your renderer doesn't support texture targets" << std::endl;
          abort();
        }


        sprite_.Update(NullOpt, pixels, MY_SPRITE_SIZE * MY_SPRITE_SIZE);
        sprite_.SetBlendMode(SDL_BLENDMODE_BLEND);

        // Two render target textures
        target1_.SetBlendMode(SDL_BLENDMODE_BLEND);
        target2_.SetBlendMode(SDL_BLENDMODE_BLEND);
      }

      ~OverlayWindow() {
        stop();
      }

      void stop() {
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

      void start() {
        std::scoped_lock lock(mutex_);
        if (running_ || thread_)
          return;

        running_ = true;
        thread_ = std::make_unique<std::thread>(&OverlayWindow::runnable, this);

      }

      void join() {
        if (running_ && thread_ && thread_->joinable())
          thread_->join();

      }

    protected:

      void runnable() {
        while (running_) {
          // Process input
          SDL_Event event;
          while (SDL_PollEvent(&event))
            if (event.type == SDL_QUIT || (event.type == SDL_KEYDOWN && (event.key.keysym.sym == SDLK_ESCAPE || event.key.keysym.sym == SDLK_q))) {
              running_ = false;
              break;
            }

          // Note we fill with transparent color, not black
          renderer_.SetDrawColor(0, 0, 0, 0);

          // Fill base texture with sprite_ texture
          renderer_.SetTarget(target1_);
          renderer_.Clear();
          renderer_.Copy(sprite_);

          // Repeat several cycles of flip-flop tiling
          for (int i = 0; i < 4; i++) {
            renderer_.SetTarget(target2_);
            renderer_.Clear();
            renderer_.Copy(target1_, NullOpt, Rect(0, 0, MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2), SDL_GetTicks() / 10000.0 * 360.0);
            renderer_.Copy(target1_, NullOpt, Rect(MY_RENDER_TARGET_SIZE / 2, 0, MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2), SDL_GetTicks() / 10000.0 * 360.0);
            renderer_.Copy(target1_, NullOpt, Rect(0, MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2), SDL_GetTicks() / 10000.0 * 360.0);
            renderer_.Copy(target1_, NullOpt, Rect(MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2, MY_RENDER_TARGET_SIZE / 2), SDL_GetTicks() / 10000.0 * 360.0);

            // Swap textures to copy recursively
            std::swap(target1_, target2_);
          }

          // Draw result to screen
          renderer_.SetTarget();
          renderer_.Clear();
          renderer_.Copy(target1_, NullOpt, Rect((MY_SCREEN_WIDTH - MY_SCREEN_HEIGHT) / 2, 0, MY_SCREEN_HEIGHT, MY_SCREEN_HEIGHT), SDL_GetTicks() / 10000.0 * 360.0);
          renderer_.Present();

          // Frame limiter
          SDL_Delay(1);
        }
      }



    };

  }


  CLI::App *SessionPlayArgCommand::createCommand(CLI::App *app) {

    auto cmd = app->add_subcommand("play", "Play Live Session");

    cmd->add_option("-f,--file", filename_, "IBT Input file");
    return cmd;
  }

  int SessionPlayArgCommand::execute() {
    UI::OverlayWindow win;
    win.start();

    win.join();
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