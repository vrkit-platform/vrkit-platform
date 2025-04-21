#pragma once
#include <windows.h>
#include <string>
#include <IRacingTools/Shared/Logging/LoggingManager.h>


namespace IRacingTools::Shared::Utils {
  template <class... Args>
  std::unexpected<IRacingSDK::GeneralError> LogAndReturnGeneralError(
    const std::format_string<Args...> fmt,
    Args&&... args
  ) {
    static auto L = Logging::GetCategoryWithName("ErrorHelpers");
    auto msg = std::format(fmt, std::forward<Args>(args)...);
    L->error(msg);
    return std::unexpected<IRacingSDK::GeneralError>(msg);
  }
}