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

#include <IRacingTools/Models/LapTrajectory.pb.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
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
        auto L = GetCategoryWithType<ServiceDaemonArgCommand>();

        using ServiceManagerType = ServiceManager<TelemetryDataService, TrackMapService>;
        std::shared_ptr<ServiceManagerType> gServiceManager{nullptr};
        
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
        return cmd;
    }

    int ServiceDaemonArgCommand::execute() {
        std::string clazzName = IRacingTools::Shared::Utils::GetPrettyTypeId<ServiceDaemonArgCommand>().value().name;
        L->info("Starting " APP_NAME " Command >> {}", clazzName);
        
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
