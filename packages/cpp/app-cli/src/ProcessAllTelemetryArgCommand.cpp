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
#include <IRacingTools/SDK/VarHolder.h>

#include "ProcessAllTelemetryArgCommand.h"

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>

namespace IRacingTools::App::Commands {
    using namespace IRacingTools::SDK;
    using namespace IRacingTools::SDK::Utils;
    using namespace IRacingTools::Shared;
    using namespace spdlog;
    
    namespace {
        log::logger L = GetCategoryWithType<ProcessAllTelemetryArgCommand>();
    }

    CLI::App* ProcessAllTelemetryArgCommand::createCommand(CLI::App* app) {
        auto cmd = app->add_subcommand("process-all-telemetry", "Process all available telemetry");

        cmd->add_option("-i,--input", extraInputPaths_, "Additional input paths");

        cmd->add_option("-o,--output", outputPath_, "Override the output path");

        return cmd;
    }

    int ProcessAllTelemetryArgCommand::execute() {
        auto& extraInputPaths = std::accumulate(extraInputPaths_.begin(), extraInputPaths_.end(), std::vector<fs::path>{}, [&] (auto & paths, auto& path) {
            if (fs::exists(path) && fs::is_directory(path)){
                L.info("Valid input path provided ({})", path);
                paths.push_back(path);
            }else {
                L.warn("Invalid input path provided ({}), ignoring", path);
            }
            return paths;
        });

        

        auto outputPath = fs::path(outputPath_);
        assert((!outputPath_.empty() && "Output path is invalid"));

        // Create output path if needed
        outputPath = std::filesystem::absolute(outputPath);        
        if (outputPath.has_parent_path()) {
            auto outputDir = outputPath.parent_path();
            if (!fs::exists(outputDir))
                std::filesystem::create_directories(outputPath);
            
            assert((std::filesystem::is_directory(outputPath) && "Fail create output path"));
        }

        // Convert IBT -> LapTrajectory
        Services::LapTrajectoryTool tool;
        auto lapRes  = tool.createLapTrajectory(ibtPath, {.outputDir = outputPath});
        if (!lapRes) {
            critical("Failed to create lap trajectory: {}", lapRes.error().what());
            return 1;
        }
        return 0;        
    }
}
