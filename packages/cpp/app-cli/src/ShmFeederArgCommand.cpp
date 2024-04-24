//
// Created by jglanz on 4/19/2024.
//

#include "ShmFeederArgCommand.h"

#include <IRacingTools/Shared/SharedMemoryStorage.h>

namespace IRacingTools::App::Commands {
  using namespace IRacingTools::Shared;
  CLI::App *SHMFeederArgCommand::createCommand(CLI::App *app) {

    auto cmd = app->add_subcommand("shm-feeder", "Shared Memory Feeder (for testing)");

    return cmd;
  }

  int SHMFeederArgCommand::execute() {
    auto shm = SharedMemoryStorage::GetInstance();

    return 0;
  }
}