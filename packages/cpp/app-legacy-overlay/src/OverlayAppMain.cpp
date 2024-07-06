//
// Created by jglanz on 1/4/2024.
//

#include "OverlayAppMain.h"
#include <shellapi.h>
#include <windows.h>

#include <fmt/core.h>
#include <CLI/CLI.hpp>

#include "TrackMapWindow.h"
#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Graphics/DX11Resources.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <winrt/base.h>

using namespace IRacingTools::SDK::Utils;

int WINAPI WinMain(
    HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/, LPSTR /*lpCmdLine*/, int /*nCmdShow*/
) {

    auto wcmdline = GetCommandLineW();
    auto cmdline = ToUtf8(wcmdline);

    CLI::App cli{"IRacing Tools Overlays"};

    std::string filename;
    cli.add_option("-f,--file", filename, "track map file");

    cli.parse(cmdline, true);
    LOGD(fmt::format("parsed filename: {}", filename));

    auto shm = IRacingTools::Shared::SHM::GetInstance();
    winrt::check_bool(shm->loadTrackMapFromTrajectoryFile(filename));

    // Ignoring the return value because we want to continue running even in the
    // unlikely event that HeapSetInformation fails.
    HeapSetInformation(nullptr, HeapEnableTerminationOnCorruption, nullptr, 0);

    winrt::check_hresult(CoInitialize(nullptr));
    {
        TrackMapWindow app;
        winrt::check_hresult(app.initialize());
        app.eventLoop();
    }
    CoUninitialize();


    return 0;
}
