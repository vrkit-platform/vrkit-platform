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

#include <IRacingTools/Shared/UnicodeHelpers.h>
#include "TrackMapWindow.h"


int WINAPI WinMain(
    HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/, LPSTR /*lpCmdLine*/, int /*nCmdShow*/
) {
    int argc;
    auto wcmdline = GetCommandLineW();
    auto cmdline = UnicodeConvStd::ToUtf8(wcmdline);

    CLI::App app{"App description"};

    std::string filename;
    app.add_option("-f,--file", filename, "A help string");

    app.parse(cmdline, true);
    LOGD(fmt::format("parsed filename: {}", filename));
    //   IRacingTools::Apps::Shared::SharedMemoryStorage test;
    // test.noop();

    // Ignoring the return value because we want to continue running even in the
    // unlikely event that HeapSetInformation fails.
    HeapSetInformation(nullptr, HeapEnableTerminationOnCorruption, nullptr, 0);

    if (SUCCEEDED(CoInitialize(nullptr))) {
        {
            TrackMapWindow app;

            AssertOkMsg(app.initialize(), "Failed to initialize");
            app.eventLoop();
        }
        CoUninitialize();
    }

    return 0;
}
