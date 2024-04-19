//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include "ArgCommand.h"
#include <chrono>
#include <format>
#include <iostream>
#include <QtCore>

#include <CLI/CLI.hpp>
#include <fmt/core.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/ClientManager.h>


using namespace std::literals;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;




class SessionRecordArgCommand: public ArgCommand {
public:
  void configure(CLI::App * app) override;
  int execute() override;

private:
  std::string outputPath_{};
  bool printHeader_{false};
  bool printData_{false};
};
