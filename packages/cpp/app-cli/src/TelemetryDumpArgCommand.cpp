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

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/LiveConnection.h>

#include "TelemetryDumpArgCommand.h"

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/SDK/Utils/FileHelpers.h>
#include <IRacingTools/Shared/Chrono.h>

namespace IRacingTools::App::Commands {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;

  namespace {
    log::logger L = GetCategoryWithType<TelemetryDumpArgCommand>();
  }// namespace

  CLI::App *TelemetryDumpArgCommand::createCommand(CLI::App *app) {
    auto cmd = app->add_subcommand("telemetry-dump", "Dump telemetry data & metadata from IBT file");

    cmd->add_flag("--headers,!--no-headers", flags_.headers, "Include headers")->default_val(true);
    cmd->add_flag("--json", flags_.json, "Dump format JSON");
    cmd->add_flag("--yaml", flags_.yaml, "Dump format YAML");
    cmd->add_option("--ibt", ibtPath_, "IBT Input file to use")->required(true);
    cmd->add_option("-o,--output,--output-filename,--output-base-filename", outputBaseFilename_,
                    "output filename without extension")
        ->required(true);
    cmd->add_flag("-p,--print,--print-cout,!--no-print-cout", flags_.printStdOut, "Print output to stdout")
        ->default_val(true);
    return cmd;
  }

  int TelemetryDumpArgCommand::execute() {
    auto ibtPath = ibtPath_;
    
    auto flags = flags_;

    DiskClient client(ibtPath, ibtPath);

    DumpOutput output;
    output.json = flags.json ? std::make_optional<nlohmann::json>() : std::nullopt;
    output.yaml = flags.yaml ? std::make_optional<YAML::Node>() : std::nullopt;

    if (flags.headers) {
      if (output.json) {
        auto &json = output.json.value();
        auto &varsMetadata = json["metadata"]["vars"] = nlohmann::json::array();
        for (auto &it: client.getVarHeaders()) {
          varsMetadata.push_back({
              {"name", std::string(it.name)},
              {"desc", std::string(it.desc)},
              {"count", it.count},
              {"countAsTime", it.countAsTime},
              {"unit", std::string(it.unit)},
              {"type", magic_enum::enum_name(it.type).data()},
          });
        }
      }
    }

    if (output.json) {

      auto jsonStr = output.json.value().dump(4);
      if (flags.printStdOut)
        std::cout << jsonStr << std::endl;

      if (!outputBaseFilename_.empty()) {
        L.info("Writing JSON to {}", outputBaseFilename_.string());
        auto jsonFile = fs::path(outputBaseFilename_.string() + ".json");

        auto res = Utils::WriteTextFile(jsonFile, jsonStr);
        if (!res || res.value() < jsonStr.length()) {
          if (res && !res.value()) {
            // std::cerr << std::format("Unable to write to {}: {} ",jsonFile.string());
            L.error("Unable to write to {}", jsonFile.string());
          } else {
            L.error("Unable to write to {}: {} ", jsonFile.string(), res.error().what());
          }
        } else
          L.info("Wrote JSON to {}", outputBaseFilename_.string());
      }
    }

    return 0;
  }
}// namespace IRacingTools::App::Commands
