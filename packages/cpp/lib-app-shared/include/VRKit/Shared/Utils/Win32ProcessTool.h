#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingSDK/ErrorTypes.h>

namespace VRKit::Shared::Utils {
  void WindowsSetHighPriorityProcess();

  std::string GetProcessName();
}// namespace VRKit::Shared::Utils