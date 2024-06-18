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


    class GenerateTrackmapArgCommand : public ArgCommand {
        public:
            int execute() override;

        protected:
            CLI::App* createCommand(CLI::App* app) override;

        private:
            std::string ibtPath_{};
            std::string outputPath_{};
    };
}
