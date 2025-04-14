//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include "ArgCommand.h"

#include <CLI/CLI.hpp>
#include <fmt/core.h>

#include <IRacingTools/Shared/IPC/NamedPipeServer.h>

namespace IRacingTools::App::Commands {
using namespace std::literals;
using namespace IRacingSDK::Utils;
using namespace IRacingSDK;




class NamedPipeServerArgCommand: public ArgCommand {
public:

  int execute() override;

protected:
  CLI::App * createCommand(CLI::App * app) override;

};
}