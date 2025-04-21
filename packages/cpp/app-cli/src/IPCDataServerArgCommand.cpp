//
// Created by jglanz on 4/19/2024.
//


#include <conio.h>
#include <csignal>
#include <cstdio>
#include <cassert>
#include <ctime>
#include <windows.h>

#include <IRacingSDK/SessionInfo/ModelParser.h>
#include <IRacingSDK/LiveConnection.h>
#include <IRacingSDK/Utils/YamlParser.h>
#include <IRacingSDK/DiskClient.h>
#include <IRacingSDK/LiveClient.h>
#include <IRacingSDK/Types.h>
#include <IRacingSDK/Utils/YamlParser.h>

#include "IPCDataServerArgCommand.h"

#include <IRacingTools/Shared/Services/IPCDataServerService.h>
#include <IRacingTools/Shared/Services/ServiceManager.h>
#include <yaml-cpp/yaml.h>

// for timeBeginPeriod
#pragma comment(lib, "Winmm")

// 16 ms timeout
#define TIMEOUT 16

namespace IRacingTools::App::Commands {
  using namespace IRacingTools::Shared;
  using namespace IRacingTools::Shared::IPC;
  using namespace IRacingTools::Shared::Services;
  using namespace IRacingSDK;

  namespace {
    auto L = Logging::GetCategoryWithType<IPCDataServerArgCommand>();
    using ServiceManagerType = ServiceManager<IPCDataServerService>;

    std::shared_ptr<ServiceManagerType> gServiceManager{nullptr};

    void SignalHandler(int signal) {
      L->error("Interrupted by Signal ({})", signal);

      if (gServiceManager)
        gServiceManager->destroy();
    }

  } // namespace


  CLI::App* IPCDataServerArgCommand::createCommand(CLI::App* app) {
    auto cmd = app->add_subcommand("ipc-data-server", "Run NamedPipeServer, solely for debugging");
    cmd->add_option("--ibt", ibtPath_, "IBT File to use for iRacing Data")->required(false);
    cmd->add_flag("--live", useLive_, "Live Connection to iRacing Data")->required(false);

    return cmd;
  }



  int IPCDataServerArgCommand::execute() {
    auto& ibtPath = ibtPath_;
    auto& useLive = useLive_;
    bool invalidConfig = (useLive && !ibtPath.empty()) ||(!useLive && !ibtPath.empty() && !fs::exists(ibtPath));
    if (invalidConfig) {
      L->critical("--live and --ibtPath <file> are mutually exclusive.  If --ibtPath is provided, a valid file path must also be provided. (live={},ibtPath={})", useLive, ibtPath);
      return 1;
    }

    auto manager = gServiceManager = std::make_shared<ServiceManagerType>();
    std::mutex mutex;

    std::condition_variable signaled{};
    manager->events.onStateChange.subscribe([&] (auto newState,auto) {
      if (newState >= ServiceState::Running) {
        std::scoped_lock lock(mutex);
        signaled.notify_all();
      }
    });
    manager->init();

    std::signal(SIGINT, SignalHandler);
    manager->start();

    {
      std::unique_lock<std::mutex> lock(mutex);
      if (manager->state() <= ServiceState::Running) {
        L->info("Waiting for signal...");
        signaled.wait(lock,[&] {
          return manager->state() > ServiceState::Running;
        });
      }
    }

    // auto serverInstance = NamedPipeServer::Create(
    //   IPC_DATA_SERVER_PIPE_NAME,
    //   [&](
    //   std::size_t size,
    //   const BYTE* data,
    //   auto header,
    //   std::shared_ptr<NamedPipeConnection> connection,
    //   std::shared_ptr<NamedPipeServer> _server
    // ) {
    //     std::string payload(reinterpret_cast<const char*>(data), size);
    //     spdlog::info(
    //       "Connection({}).onMessage(clientId={},messageId={},messageSourceId={}): {}",
    //       connection->id(),
    //       header->clientId,
    //       header->id,
    //       header->sourceId,
    //       payload
    //     );
    //   }
    // );
    //
    // serverInstance->start(true);

    return 0;
  }
}
