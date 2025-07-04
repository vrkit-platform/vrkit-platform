//
// Created by jglanz on 4/19/2024.
//

#include "SHMViewerArgCommand.h"

#include <IRacingSDK/Types.h>
#include <VRKit/Shared/SHM/SHM.h>
#include <VRKit/Shared/UI/ViewerWindow.h>
#include <VRKit/Shared/Logging/LoggingManager.h>

namespace VRKit::App::Commands {
    using namespace VRKit::Shared;
    using namespace VRKit::Shared::UI;

    using namespace VRKit::Shared::SHM;

    using namespace IRacingSDK::Utils;
    using namespace IRacingSDK;
    
    namespace {
        auto L = Logging::GetCategoryWithType<SHMViewerArgCommand>();
    }
    
    CLI::App* SHMViewerArgCommand::createCommand(CLI::App* app) {
        auto cmd = app->add_subcommand("shm-viewer", "SHM Viewer (for testing)");

        return cmd;
    }

    int SHMViewerArgCommand::execute() {
        L->info("SHM-Viewer");
        ViewerWindow<Graphics::GraphicsPlatform::D3D11> win{};
        win.initialize();
        Window::DefaultWindowMessageLoop();
        return 0;
    }
}
