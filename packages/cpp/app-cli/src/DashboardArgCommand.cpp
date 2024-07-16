//
// Created by jglanz on 4/19/2024.
//



#include <spdlog/spdlog.h>

#include "DashboardArgCommand.h"

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/OpenXR/OpenXRSetupHelpers.h>
#include <IRacingTools/Shared/System/DisplayInfo.h>

namespace IRacingTools::App::Commands {
    using namespace Shared;

    namespace {
        auto L = Logging::GetCategoryWithType<DashboardArgCommand>();
        class NewArgCommand : public ArgCommand {
        public:
            int execute() override {
                return 0;
            }

        protected:
            CLI::App* createCommand(CLI::App* app) override {
                auto cmd = app->add_subcommand("new", "Generate new dashboard config");
                cmd->add_option("--duplicate", inputFilename_, "Dashboard JSON file to clone/copy");
                cmd->add_option("--output", outputFilename_, "Dashboard JSON destination file");
                cmd->add_flag("--no-vr", noVR_, "Include VR target screen")->default_val(false);
                cmd->add_flag("--no-displays", noDisplays_, "Include Displays/Monitors target screen")->default_val(false);
                return cmd;
            }

        private:
            std::string inputFilename_{};
            std::string outputFilename_{};
            bool noVR_{};
            bool noDisplays_{};
        };

        class ValidateArgCommand : public ArgCommand {
        public:
            int execute() override {
                return 0;
            }

        protected:
            CLI::App* createCommand(CLI::App* app) override {
                auto cmd = app->add_subcommand("validate", "Validate a dashboard config");
                cmd->add_option("--input", inputFilename_, "Dashboard JSON file to validate");
                cmd->add_flag("--vr", requireVR_, "Check VR target screen exists")->default_val(false);
                cmd->add_flag("--displays", requireDisplays_, "Check Displays/Monitors target screen exists")->default_val(false);
                return cmd;
            }

        private:
            std::string inputFilename_{};
            bool requireVR_{};
            bool requireDisplays_{};
        };

        class ListArgCommand : public ArgCommand {
        public:
            int execute() override {
                L->info("List dashboards");
                return 0;
            }

        protected:
            CLI::App* createCommand(CLI::App* app) override {
                auto cmd = app->add_subcommand("list", "List dashboard configs");
                cmd->add_flag("--vr", requireVR_, "Require VR target screen exists")->default_val(false);
                cmd->add_flag("--displays", requireDisplays_, "Require Displays/Monitors target screen exists")->default_val(
                    false
                );
                return cmd;
            }

        private:
            bool requireVR_{};
            bool requireDisplays_{};
        };
    }

    CLI::App* DashboardArgCommand::createCommand(CLI::App* app) {
        auto cmd = app->add_subcommand("dashboard", "Dashboard commands for creating and managing layouts in both VR & on Displays");
        cmd->add_option("--dir,-d", dir_, "Override the Dashboard storage directory");
        cmd->parse_complete_callback([&] {
            L->info("Parse complete callback. dir_ = {}", dir_);
        });
        cmds_ = build<ListArgCommand, ValidateArgCommand, NewArgCommand>(cmd);
        return cmd;
    }

    int DashboardArgCommand::execute() {
        L->info(
            "Dashboard command started with runtime path ({}), enabling openxr layer ({})",
            GetRuntimeDirectory().string(),
            OpenXR::GetOpenXRLayerJSONPath().string()
        );

        return 0;
    }
}
