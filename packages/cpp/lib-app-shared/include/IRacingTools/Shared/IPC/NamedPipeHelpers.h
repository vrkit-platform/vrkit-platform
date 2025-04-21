//
// Created by jglanz on 1/28/2024.
//

#pragma once
#include <string>
#include <IRacingTools/Shared/Logging/LoggingManager.h>


namespace IRacingTools::Shared::IPC {
  std::string CreateNamedPipePath(const std::string& pipeName);

  std::uint32_t NextNamedPipeConnectionId();

  template <class... Args>
  std::unexpected<std::runtime_error> LogAndReturnRuntimeError(
    const std::format_string<Args...> fmt,
    Args&&... args
  ) {
    static auto L = Logging::GetCategoryWithName("NamedPipeHelpers");
    auto msg = std::format(fmt, std::forward<Args>(args)...);
    L->error(msg);
    return std::unexpected<std::runtime_error>(msg);
  }
}
