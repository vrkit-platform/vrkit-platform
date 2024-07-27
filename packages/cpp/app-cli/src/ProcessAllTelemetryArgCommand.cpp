//
// Created by jglanz on 4/19/2024.
//

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/VarHolder.h>

#include "ProcessAllTelemetryArgCommand.h"

#include <IRacingTools/Models/LapTrajectory.pb.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Utils/TypeIdHelpers.h>

#include <IRacingTools/Shared/Services/ServiceManager.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>

namespace IRacingTools::App::Commands {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services;
  using namespace IRacingTools::Shared::Utils;

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

    cmd->add_option("-i,--input", extraInputPaths_, "Additional input paths");

    cmd->add_option("-o,--output", outputPath_, "Override the output path");

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
} // namespace IRacingTools::App::Commands
