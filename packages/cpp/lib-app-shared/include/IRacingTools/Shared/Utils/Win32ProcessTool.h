#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Utils {
  void WindowsSetHighPriorityProcess();

  std::string GetProcessName();
}// namespace IRacingTools::Shared::Utils