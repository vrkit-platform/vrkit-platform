//
// Created by jglanz on 1/28/2024.
//

#pragma once
#include <string>
#include <VRKit/Shared/Logging/LoggingManager.h>


namespace VRKit::Shared::IPC {

  /**
   * Checks if a named pipe exists at the specified path.
   *
   * @param pipeName The filesystem path of the named pipe to check.
   * @return true if the named pipe exists at the specified path, false otherwise.
   */
  bool NamedPipeExists(const std::string& pipeName);

  /**
   * @brief Generate a fully qualified named pipe path.
   * 
   * @param pipeName to use for the named pipe
   * @return A fully qualified named pipe path in the format `\\.\pipe\<pipeName>`.
   */
  std::string CreateNamedPipePath(const std::string& pipeName);

  /**
   * Generates a unique connection ID for named pipes.
   * 
   * @return A unique 32-bit unsigned integer to be used as connection identifier.
   */
  std::uint32_t NextNamedPipeConnectionId();

  std::string NextNamedPipeServerName(const std::string& baseName);

  /**
   * @brief Logs an error message and returns a runtime error as unexpected.
   * 
   * @tparam Args Variadic template parameter pack for format arguments
   * @param fmt Format string for the error message
   * @param args Arguments to be formatted into the message
   * @return std::unexpected containing a runtime_error with the formatted message
   */
  template <class... Args>
  std::unexpected<std::runtime_error> LogAndReturnRuntimeError(
    const std::format_string<Args...> fmt,
    Args&&... args
  ) {
    static auto L = Logging::GetCategoryWithName(__FILE__);
    auto msg = std::format(fmt, std::forward<Args>(args)...);
    L->error(msg);
    return std::unexpected<std::runtime_error>(msg);
  }


}
