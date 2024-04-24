//
// Created by jglanz on 4/20/2024.
//

#include "ArgCommand.h"

namespace IRacingTools::App::Commands {
  CLI::App *ArgCommand::setup(CLI::App *app) {
    auto cmd = createCommand(app);
    cmd->callback([&]() {
      return execute();
    });
    return cmd;
  }
}