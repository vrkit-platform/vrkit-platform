//
// Created by jglanz on 4/19/2024.
//

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>

#include <IRacingSDK/DiskClient.h>
#include <IRacingSDK/DiskClientDataFrameProcessor.h>
#include <IRacingSDK/LiveConnection.h>
#include <IRacingSDK/VarHolder.h>

#include "ProcessAllTelemetryArgCommand.h"

#include <VRKit/Models/LapTrajectory.pb.h>
#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <VRKit/Shared/Chrono.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Services/LapTrajectoryTool.h>
#include <VRKit/Shared/Utils/TypeIdHelpers.h>

#include <VRKit/Shared/Services/ServiceManager.h>
#include <VRKit/Shared/Services/TelemetryDataService.h>
#include <VRKit/Shared/Services/TrackMapService.h>

namespace VRKit::App::Commands {
  using namespace IRacingSDK;
  using namespace IRacingSDK::Utils;
  using namespace VRKit::Shared;
  using namespace VRKit::Shared::Logging;
  using namespace VRKit::Shared::Services;
  using namespace VRKit::Shared::Utils;

  namespace {
    auto L = GetCategoryWithType<ProcessAllTelemetryArgCommand>();

    using ServiceManagerType =
        ServiceManager<TelemetryDataService, TrackMapService>;
    std::shared_ptr<ServiceManagerType> gServiceManager{nullptr};

    void SignalHandler(int signal) {
      std::cerr << "Interrupted by Signal" << signal << "\n";
      L->info("Interrupted ({})", signal);

      if (gServiceManager)
        gServiceManager->destroy();
    }
  } // namespace

  CLI::App *ProcessAllTelemetryArgCommand::createCommand(CLI::App *app) {
    auto cmd = app->add_subcommand(
        "process-all-telemetry", "Process all available telemetry");

    std::string userHomeDirStr {getenv("USERPROFILE")};
    if (userHomeDirStr.empty() || !fs::is_directory(userHomeDirStr)) {
      userHomeDirStr = getenv("HOME");
    }


    fs::path userHomeDir {userHomeDirStr};
    fs::path iracingTelemDir = userHomeDir / "Documents" / "iRacing" / "Telemetry";
    cmd->add_option("-i,--input", extraInputPaths_, "Additional input paths")->required(false)->default_val(std::vector<std::string>{iracingTelemDir.string()});

    cmd->add_option("-o,--output", outputPath_, "Override the output path")->required(true);

    return cmd;
  }

  int ProcessAllTelemetryArgCommand::execute() {
    auto clazzName =
        GetPrettyTypeId<ProcessAllTelemetryArgCommand>().value().name;
    L->info("Starting " APP_NAME " Command >> {}", clazzName);

    auto extraInputPaths = std::accumulate(
        extraInputPaths_.begin(),
        extraInputPaths_.end(),
        std::vector<fs::path>{},
        [&](std::vector<fs::path> paths, const std::string &path) {
          if (fs::exists(path) && fs::is_directory(path)) {
            L->info("Valid input path provided ({})", path);
            paths.emplace_back(path);
          } else {
            L->warn("Invalid input path provided ({}), ignoring", path);
          }
          return paths;
        });


    auto &manager = gServiceManager = std::make_shared<ServiceManagerType>();


    std::signal(SIGINT, SignalHandler);
    L->info("Initializing");
    manager->init();
    auto tdService = manager->getService<TelemetryDataService>();
    auto tmService = manager->getService<TrackMapService>();
    VRK_LOG_AND_FATAL_IF(
        !tdService,
        "Unable to find service >> {}",
        GetPrettyTypeId<TelemetryDataService>().value().name);
    std::mutex resultMutex{};
    std::condition_variable resultCV{};
    std::atomic_bool resultReceived{};

    auto checkPending = [&] {
      std::scoped_lock lock(resultMutex);

      resultReceived =
          !tdService->hasPendingTasks() && !tmService->hasPendingTasks();
      resultCV.notify_all();
    };

    tdService->events.onFilesChanged.subscribe([&](auto, auto) {
      checkPending();
    });

    tmService->events.onFilesChanged.subscribe([&](auto, auto) {
      checkPending();
    });

    L->info("Starting");
    manager->start();
    L->info("Scanning all IBT files in paths");
    tdService->scanAllFiles(extraInputPaths);

    {
      std::unique_lock lock(resultMutex);
      if (tdService->hasPendingTasks() || tmService->hasPendingTasks()) {
        resultCV.wait(lock, [&] {
          return resultReceived.load();
        });
      }
    }

    L->info("Destroying services");
    manager->destroy();

    return 0;
  }
} // namespace VRKit::App::Commands
