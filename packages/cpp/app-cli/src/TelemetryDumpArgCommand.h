//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include "ArgCommand.h"

#include <CLI/CLI.hpp>
#include <optional>
#include <yaml-cpp/yaml.h>

namespace IRacingTools::App::Commands {
    using namespace std::literals;
    using namespace IRacingTools::SDK::Utils;
    using namespace IRacingTools::SDK;


    class TelemetryDumpArgCommand : public ArgCommand {
        public:
            enum DumpFormat {
                JSON = 0,
                YAML = 1
            };

            struct DumpOutput {

                std::optional<nlohmann::json> json{std::nullopt};
                std::optional<YAML::Node> yaml{std::nullopt};

                bool useJSON() const {
                    return json.has_value();
                }

                bool useYAML() const {
                    return yaml.has_value();
                }
            };

            int execute() override;

        protected:
            CLI::App* createCommand(CLI::App* app) override;

        private:
            std::string ibtPath_{};
            
            fs::path outputBaseFilename_{};
            struct {
                bool headers{true};
                bool printStdOut{true};
                bool json{true};
                bool yaml{true};
            } flags_{};


    };
}
