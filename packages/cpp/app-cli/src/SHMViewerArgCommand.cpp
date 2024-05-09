//
// Created by jglanz on 4/19/2024.
//

#include "SHMViewerArgCommand.h"

#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/UI/ViewerWindow.h>

namespace IRacingTools::App::Commands {
    using namespace IRacingTools::Shared;
    using namespace IRacingTools::Shared::UI;

    using namespace IRacingTools::Shared::SHM;

    using namespace IRacingTools::SDK::Utils;
    using namespace IRacingTools::SDK;

    CLI::App* SHMViewerArgCommand::createCommand(CLI::App* app) {
        auto cmd = app->add_subcommand("shm-viewer", "SHM Viewer (for testing)");

        return cmd;
    }

    int SHMViewerArgCommand::execute() {
        spdlog::info("SHM-Viewer");
        ViewerWindow<Graphics::GraphicsPlatform::D3D11> win{};
        win.initialize();
        Window::DefaultWindowMessageLoop();
        return 0;
    }
}
