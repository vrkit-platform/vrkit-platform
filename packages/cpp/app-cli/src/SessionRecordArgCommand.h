//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include "ArgCommand.h"
#include <chrono>
#include <format>
#include <iostream>

#include <CLI/CLI.hpp>
#include <fmt/core.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/ClientManager.h>

namespace IRacingTools::App::Commands {
using namespace std::literals;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;




class SessionRecordArgCommand: public ArgCommand {
public:

  int execute() override;

protected:
  CLI::App * createCommand(CLI::App * app) override;

private:
  std::string outputPath_{};
  bool printHeader_{true};
  bool printData_{true};
};
}