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
    auto service = manager->getService<TelemetryDataService>();
    VRK_LOG_AND_FATAL_IF(
        !service,
        "Unable to find service >> {}",
        GetPrettyTypeId<TelemetryDataService>().value().name);
    std::mutex resultMutex{};
    std::condition_variable resultCV{};
    std::atomic_bool resultReceived{};

    service->events.onRequestComplete.subscribe(
        [&](auto _, auto res, auto req) {
          L->info(
              "Request ({}) completed\n"
              "Processed: {}\n"
              "Failed: {}\n"
              "Unprocessed: {}\n",
              req->id,
              res->processedFiles.size(),
              res->failedFiles.size(),
              res->unprocessedFiles.size());
          std::scoped_lock lock(resultMutex);
          resultReceived = true;
          resultCV.notify_all();
        });

    L->info("Starting");
    manager->start();

    {
      std::unique_lock lock(resultMutex);
      if (!resultReceived) {
        resultCV.wait(lock, [&] {
          return resultReceived.load();
        });
      }
    }

    // auto submitRes = service->submitRequest({});
    // if (!submitRes) {
    //     auto& err = submitRes.error();
    //     // TODO: Handle error
    //     L->error("Failed to submit request: {}", err.what());
    // } else {
    //     auto future = submitRes.value();
    //     L->info("submitted request, waiting on future");
    //     auto result = future.get();
    //
    //     L->info("result received (status={})",
    //     magic_enum::enum_name(result->status).data());
    //
    // }

    L->info("Destroying services");
    manager->destroy();

    // auto outputPath = fs::path(outputPath_);
    // assert((!outputPath_.empty() && "Output path is invalid"));

    // // Create output path if needed
    // outputPath = std::filesystem::absolute(outputPath);
    // if (outputPath.has_parent_path()) {
    //     auto outputDir = outputPath.parent_path();
    //     if (!fs::exists(outputDir))
    //         std::filesystem::create_directories(outputPath);

    //     assert((std::filesystem::is_directory(outputPath) && "Fail create
    //     output path"));
    // }

    // Convert IBT -> LapTrajectory
    // Services::LapTrajectoryTool tool;
    // auto lapRes  = tool.createLapTrajectory(ibtPath, {.outputDir =
    // outputPath}); if (!lapRes) {
    //     critical("Failed to create lap trajectory: {}",
    //     lapRes.error().what()); return 1;
    // }
    return 0;
  }
} // namespace IRacingTools::App::Commands
