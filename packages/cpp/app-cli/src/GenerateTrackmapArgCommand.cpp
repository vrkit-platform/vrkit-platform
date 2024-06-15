//
// Created by jglanz on 4/19/2024.
//


// #define MIN_WIN_VER 0x0501
//
// #ifndef WINVER
//   #define WINVER MIN_WIN_VER
// #endif
//
// #ifndef _WIN32_WINNT
//   #define _WIN32_WINNT MIN_WIN_VER
// #endif
//
// #pragma warning(disable : 4996)//_CRT_SECURE_NO_WARNINGS
#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>

#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>

#include "GenerateTrackmapArgCommand.h"

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/Chrono.h>

namespace IRacingTools::App::Commands {
    using namespace IRacingTools::SDK;

    namespace {
        class LapTrajectoryBuilder {
            public:
                struct Context {};

                explicit LapTrajectoryBuilder(
                    const fs::path& ibtPath,
                    const std::optional<fs::path>& outputPath = std::nullopt
                ): ibtPath_{ibtPath}, outputPath_{outputPath} {}

                std::expected<Models::Telemetry::LapTrajectory, GeneralError> execute() {
                    using DataFrameProcessor = DiskClientDataFrameProcessor<Context>;

                    Models::Telemetry::LapTrajectory lap{};
                    Context data{};
                    DataFrameProcessor processor(ibtPath_);

                    auto res = processor.run(
                        [&](const DataFrameProcessor::Context& context, Context& result) -> bool {
                            // TODO: Implement the logic here
                            return true;
                        },
                        data
                    );

                    return lap;
                }

            private:
                fs::path ibtPath_{};
                std::optional<fs::path> outputPath_{};
        };
    }

    CLI::App* GenerateTrackmapArgCommand::createCommand(CLI::App* app) {
        auto cmd = app->add_subcommand("generate-trackmap", "Generate trackmap from IBT");

        cmd->add_option("-o,--output", outputPath_, "Output path")->required(false)->default_val("");

        cmd->add_option("--ibt", ibtPath_, "IBT Input file to use")->required(true);

        return cmd;
    }

    int GenerateTrackmapArgCommand::execute() {
        auto ibtPath = ibtPath_;

        auto outputPath = outputPath_;
        fmt::println("outputPath: {}", outputPath);
        assert((!outputPath.empty() && "Output path is invalid"));
        outputPath = std::filesystem::absolute(outputPath).string();

        fmt::println("Absolute Output Path: {}", outputPath);
        std::filesystem::create_directories(outputPath);
        assert((std::filesystem::is_directory(outputPath) && "Fail create output path"));

        LapTrajectoryBuilder(ibtPath, outputPath).execute();

        throw NotImplementedError("GenerateTrackmapArgCommand");
    }
}
