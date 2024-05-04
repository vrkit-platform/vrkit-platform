#pragma once
#include <chrono>
#include <cmath>

namespace IRacingTools::SDK::Utils {
  template<typename Unit, typename R = int>
  R SessionTimeToDuration(double sourceSessionTimeValue) {
    std::chrono::microseconds sourceSessionTime(static_cast<std::size_t>(std::floor(sourceSessionTimeValue * 1000000.0)));
    return std::chrono::duration_cast<Unit>(sourceSessionTime).count();
  }

  inline int SessionTimeToMillis(double sourceSessionTimeValue) {
    return SessionTimeToDuration<std::chrono::milliseconds, int>(sourceSessionTimeValue);
  }
}