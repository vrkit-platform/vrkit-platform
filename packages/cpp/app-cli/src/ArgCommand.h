//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include <CLI/CLI.hpp>
#include <fmt/core.h>

class ArgCommand {
public:
  virtual void configure(CLI::App * app) = 0;
  virtual int execute() = 0;
};