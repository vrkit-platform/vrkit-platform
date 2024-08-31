//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include "ArgCommand.h"

#include <CLI/CLI.hpp>

namespace IRacingTools::App::Commands {
  using namespace std::literals;

  class DashboardArgCommand : public ArgCommand {
  public:
    virtual int execute() override;

  protected:
    CLI::App *createCommand(CLI::App *app) override;

  private:
    std::string dir_{};
    ArgCommandList cmds_{};
  };
}