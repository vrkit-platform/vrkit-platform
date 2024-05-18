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

#include "GenerateTrackmapArgCommand.h"

namespace IRacingTools::App::Commands
{
  namespace
  {

    using namespace IRacingTools::SDK;


  }// namespace


  CLI::App *GenerateTrackmapArgCommand::createCommand(CLI::App *app)
  {

    auto cmd = app->add_subcommand("generate-trackmap", "Generate trackmap from IBT");

    cmd->add_option("-o,--output", outputPath_, "Output path")->required(false)->default_val("");

    cmd->add_option("--ibt", ibtPath_, "IBT Input file to use")->required(true);

    return cmd;
  }

  int GenerateTrackmapArgCommand::execute()
  {
    auto outputPath = outputPath_;
    fmt::println("outputPath: {}", outputPath);
    assert((!outputPath.empty() && "Output path is invalid"));
    outputPath = std::filesystem::absolute(outputPath).string();
    fmt::println("Absolute Output Path: {}", outputPath);
    std::filesystem::create_directories(outputPath);
    assert((std::filesystem::is_directory(outputPath) && "Fail create output path"));

    throw NotImplementedError("GenerateTrackmapArgCommand");
  }
}