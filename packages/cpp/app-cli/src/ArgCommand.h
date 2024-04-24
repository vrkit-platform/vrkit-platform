//
// Created by jglanz on 4/19/2024.
//

#pragma once

#include <CLI/CLI.hpp>
#include <fmt/core.h>

namespace IRacingTools::App::Commands {
  class ArgCommand;
  using ArgCommandPtr = std::shared_ptr<ArgCommand>;
  using ArgCommandList = std::vector<ArgCommandPtr>;

  class ArgCommand {
  public:

    [[maybe_unused]] virtual int execute() = 0;

  protected:
    CLI::App *setup(CLI::App *app);
    [[maybe_unused]] virtual CLI::App *createCommand(CLI::App *app) = 0;

    /**
     * @brief Recursive assemble command for iterating & creating the supplied `ArgCommand(s)...`
     * @tparam N total number of commands
     * @tparam I index of current
     * @tparam T the `ArgCommand` implementation type @ `I` index
     * @tparam Rest remainder of `ArgCommand` implementations
     *
     * @param cmds reference to list of cmds being assembled
     *
     * @return reference to list of cmds being assembled
     */
    template<size_t N, size_t I, typename T, typename... Rest>
    static ArgCommandList &assemble(CLI::App *app, ArgCommandList &cmds) {
      if constexpr (I >= N)
        return cmds;

      cmds.emplace_back(new T());
      cmds.back()->setup(app);
      if constexpr (I < N - 1) {
        return assemble<N, I + 1, Rest...>(app, cmds);
      }

      return cmds;
    }

  public:
    /**
     * @brief Assemble a list argument commands
     *
     * @tparam Ctors constructors for implementations of `ArgCommand`
     * @return
     */
    template<typename... Ctors> static ArgCommandList build(CLI::App *app) {
      constexpr size_t size = sizeof...(Ctors);
      ArgCommandList instances(size);
      return assemble<size, 0, Ctors...>(app, instances);
    }
  };


}// namespace IRacingTools::App::Shared::Utils