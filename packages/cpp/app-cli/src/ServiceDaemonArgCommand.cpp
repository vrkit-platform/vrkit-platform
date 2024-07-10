//
// Created by jglanz on 4/19/2024.
//


// #define MIN_WIN_VER 0x0501
//
// #ifndef WINVER
//   #define WINVER MIN_WIN_VER
// #endif
//
// #ifndef _WIN32_WINNT
//   #define _WIN32_WINNT MIN_WIN_VER
// #endif
//
// #pragma warning(disable : 4996)//_CRT_SECURE_NO_WARNINGS
#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>

#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/VarHolder.h>

#include "ServiceDaemonArgCommand.h"

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

#include <IRacingTools/Shared/Services/ServiceManager.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

namespace IRacingTools::App::Commands {
    using namespace IRacingTools::SDK;
    using namespace IRacingTools::SDK::Utils;
    using namespace IRacingTools::Shared;
    using namespace IRacingTools::Shared::Logging;    
    using namespace IRacingTools::Shared::Services;
    
    namespace {
        using ServiceManagerType = ServiceManager<TelemetryDataService>;
        std::shared_ptr<ServiceManagerType> gServiceManager{nullptr};
        auto L = GetCategoryWithType<ServiceDaemonArgCommand>();

        void SignalHandler(int signal)
        {
            std::cerr << "Interrupted by Signal" << signal << "\n";
            L->info("Interrupted ({})", signal);

            if (gServiceManager)
                gServiceManager->destroy();
        }
    }

    CLI::App* ServiceDaemonArgCommand::createCommand(CLI::App* app) {
        auto cmd = app->add_subcommand("service-daemon", "Run the default service daemon by itself");

        // cmd->add_option("-i,--input", extraInputPaths_, "Additional input paths");

        // cmd->add_option("-o,--output", outputPath_, "Override the output path");

        return cmd;
    }

    int ServiceDaemonArgCommand::execute() {
        
         L->info("test 123");
         L->flush();
        auto & manager = gServiceManager = std::make_shared<ServiceManagerType>();
        

        std::signal(SIGINT, SignalHandler);
        L->info("Initializing");
        manager->init();
        L->info("Starting");
        manager->start();
        L->info("Waiting");
        manager->wait();

        return 0;        
    }
}
