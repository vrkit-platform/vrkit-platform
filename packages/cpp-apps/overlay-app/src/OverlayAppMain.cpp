//
// Created by jglanz on 1/4/2024.
//

#include "OverlayAppMain.h"
#include <shellapi.h>
#include <windows.h>

#include <fmt/core.h>
#include <CLI/CLI.hpp>


#include <IRacingTools/Shared/Graphics/DX11Resources.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include "TrackMapWindow.h"
#include <IRacingTools/Shared/UnicodeHelpers.h>
#include <winrt/base.h>

int WINAPI WinMain(
    HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/, LPSTR /*lpCmdLine*/, int /*nCmdShow*/
) {

    auto wcmdline = GetCommandLineW();
    auto cmdline = UnicodeConvStd::ToUtf8(wcmdline);

    CLI::App cli{"IRacing Tools Overlays"};

    std::string filename;
    cli.add_option("-f,--file", filename, "track map file");

    cli.parse(cmdline, true);
    LOGD(fmt::format("parsed filename: {}", filename));

    auto shm = IRacingTools::Shared::SharedMemoryStorage::GetInstance();
    winrt::check_bool(shm->loadTrackMapFromLapTrajectoryFile(filename));

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
