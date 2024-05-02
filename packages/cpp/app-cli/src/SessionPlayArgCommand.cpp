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
#include <memory>

#include "SessionPlayArgCommand.h"
#include "IRacingTools/Shared/SharedMemoryStorage.h"
#include "OverlayWindow.h"
#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/DX11TrackMapWidget.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>

namespace IRacingTools::App::Commands
{
  using namespace Shared;

  namespace UI
  {


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