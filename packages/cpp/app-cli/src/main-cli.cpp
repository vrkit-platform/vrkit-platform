//
// Created by jglanz on 1/4/2024.
//

#include <algorithm>

#include <CLI/CLI.hpp>
#include <fmt/core.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/ClientManager.h>
#include <QCoreApplication>
#include <QDebug>

#include "GenerateTrackmapArgCommand.h"
#include "SessionPlayArgCommand.h"
#include "SessionRecordArgCommand.h"

using namespace std::literals;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;
using namespace IRacingTools::App::Commands;

int main(int argc, char** argv) {
    QCoreApplication::setApplicationName(APP_NAME);
    QCoreApplication::setApplicationVersion(APP_VERSION);

    CLI::App app{APP_NAME};
    fmt::println("{}", APP_NAME);

    auto cmds = ArgCommand::build<GenerateTrackmapArgCommand,SessionPlayArgCommand,SessionRecordArgCommand>(&app);

    CLI11_PARSE(app,argc,argv);

    return 0;
}