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

#include "NamedPipeServerArgCommand.h"

#include <yaml-cpp/yaml.h>

// for timeBeginPeriod
#pragma comment(lib, "Winmm")

// 16 ms timeout
#define TIMEOUT 16

namespace IRacingTools::App::Commands {
  namespace {

    using namespace IRacingSDK;

    enum class ExampleMessageType : std::uint32_t {
      Request1 = 0,
      Request2,
      Request3
    };

  } // namespace


  CLI::App* NamedPipeServerArgCommand::createCommand(CLI::App* app) {
    auto cmd = app->add_subcommand("named-pipe-server", "Run NamedPipeServer, solely for debugging");
    return cmd;
  }


  int NamedPipeServerArgCommand::execute() {
    using namespace IRacingTools::Shared::IPC;
    auto serverInstance = std::make_shared<NamedPipeServer>(
      [&](
      std::size_t size,
      const BYTE* data,
      auto header,
      std::shared_ptr<NamedPipeConnection> connection,
      std::shared_ptr<NamedPipeServer> server
    ) {
        std::string payload(reinterpret_cast<const char*>(data), size);
        spdlog::info(
          "Connection({}).onMessage(clientId={},messageId={},messageSourceId={}): {}",
          connection->id(),
          header->clientId,
          header->id,
          header->sourceId,
          payload
        );

      }
    );

    return 0;
  }
}
