//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include "ArgCommand.h"

#include <CLI/CLI.hpp>

namespace IRacingTools::App::Commands {
    using namespace std::literals;
    using namespace IRacingTools::SDK::Utils;
    using namespace IRacingTools::SDK;


    class ProcessAllTelemetryArgCommand : public ArgCommand {
        public:
            int execute() override;

        protected:
            CLI::App* createCommand(CLI::App* app) override;

        private:
            std::vector<std::string> extraInputPaths_{};
            std::string outputPath_{};
    };
}
