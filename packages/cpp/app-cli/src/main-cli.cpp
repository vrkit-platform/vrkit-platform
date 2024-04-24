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

#include "SessionPlayArgCommand.h"
#include "SessionRecordArgCommand.h"
#include <QtCore>
#include <chrono>
#include <format>
#include <iostream>

using namespace std::literals;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;
using namespace IRacingTools::App::Commands;

//int WINAPI WinMain(HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/, LPSTR lpCmdLine, int nCmdShow) {
    //nCmdShow, &lpCmdLine
int main(int argc, char** argv) {
    QCoreApplication::setApplicationName(APP_NAME);
    QCoreApplication::setApplicationVersion(APP_VERSION);

    CLI::App app{APP_NAME};
    fmt::println("{}", APP_NAME);

    auto cmds = ArgCommand::build<SessionPlayArgCommand,SessionRecordArgCommand>(&app);

    CLI11_PARSE(app,argc,argv);

    return 0;
}