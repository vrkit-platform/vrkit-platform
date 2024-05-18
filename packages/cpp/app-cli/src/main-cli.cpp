//
// Created by jglanz on 1/4/2024.
//
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/System/DisplayInfo.h>
#include <IRacingTools/SDK/ClientManager.h>

#include <algorithm>
#include <CLI/CLI.hpp>

#include <QCoreApplication>
#include <QDebug>



#include "SHMViewerArgCommand.h"
#include "GenerateTrackmapArgCommand.h"
#include "SessionPlayArgCommand.h"
#include "SessionRecordArgCommand.h"
#include "DashboardArgCommand.h"

using namespace std::literals;

using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;
using namespace IRacingTools::Shared;
using namespace IRacingTools::App::Commands;

int main(int argc, char** argv) {
    System::DisplayInfoSetup();
    System::GetAllDisplayInfo();

    QCoreApplication::setApplicationName(APP_NAME);
    QCoreApplication::setApplicationVersion(APP_VERSION);

    CLI::App app{APP_NAME};
    std::string appVerion{APP_VERSION};

    fmt::println("{} v{}", APP_NAME, APP_VERSION);

    // app.require_subcommand(0);
    app.set_help_all_flag("--help-all", "Show all help details");
    app.set_version_flag("--version", appVerion);

    auto cmds = ArgCommand::build<DashboardArgCommand,GenerateTrackmapArgCommand,SessionPlayArgCommand,SessionRecordArgCommand,SHMViewerArgCommand>(&app);

    CLI11_PARSE(app,argc,argv);

    return 0;
}