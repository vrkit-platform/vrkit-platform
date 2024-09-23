//
// Created by jglanz on 1/4/2024.
//
#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/System/DisplayInfo.h>

#include <CLI/CLI.hpp>
#include <algorithm>

#include <boost/di.hpp>

#include "DashboardArgCommand.h"
#include "GenerateTrackmapArgCommand.h"
#include "LiveDataReplayArgCommand.h"
#include "ProcessAllTelemetryArgCommand.h"
#include "SHMViewerArgCommand.h"
#include "SHMFeederArgCommand.h"
#include "ServiceDaemonArgCommand.h"
#include "SessionRecordArgCommand.h"
#include "TelemetryDumpArgCommand.h"


using namespace std::literals;

using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;
using namespace IRacingTools::Shared;
using namespace IRacingTools::App::Commands;

// namespace di = boost::di;

int main(int argc, char **argv) {
  System::DisplayInfoSetup();
  System::GetAllDisplayInfo();

  CLI::App app{APP_NAME};
  std::string appVersion{APP_VERSION};

  fmt::println("{} v{}", APP_NAME, APP_VERSION);

  // app.require_subcommand(0);
  app.set_help_all_flag("--help-all", "Show all help details");
  app.set_version_flag("--version", appVersion);

  auto cmds =
    ArgCommand::build<LiveDataReplayArgCommand, TelemetryDumpArgCommand, ProcessAllTelemetryArgCommand, DashboardArgCommand, GenerateTrackmapArgCommand, SessionRecordArgCommand, SHMFeederArgCommand, SHMViewerArgCommand, ServiceDaemonArgCommand>(&app);

  CLI11_PARSE(app, argc, argv);

  return 0;
}
