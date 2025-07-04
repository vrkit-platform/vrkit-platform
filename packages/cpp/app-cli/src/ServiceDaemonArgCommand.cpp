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
#include <VRKit/Shared/SharedAppLibPCH.h>

#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>

#include <IRacingSDK/LiveConnection.h>
#include <IRacingSDK/DiskClient.h>
#include <IRacingSDK/DiskClientDataFrameProcessor.h>
#include <IRacingSDK/VarHolder.h>

#include "ServiceDaemonArgCommand.h"

#include <VRKit/Models/LapTrajectory.pb.h>
#include <VRKit/Shared/Chrono.h>
#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <VRKit/Shared/Services/LapTrajectoryTool.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
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
        std::string clazzName = VRKit::Shared::Utils::GetPrettyTypeId<ServiceDaemonArgCommand>().value().name;
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
