#pragma once
#include <chrono>
#include <cmath>

namespace IRacingTools::SDK::Utils {

  template<typename Unit = std::chrono::milliseconds>
    std::chrono::duration<Unit> SessionTimeToDuration(double sourceSessionTimeValue) {
    std::chrono::microseconds sourceSessionTime(static_cast<std::size_t>(std::floor(sourceSessionTimeValue * 1000000.0)));
    return std::chrono::duration_cast<Unit>(sourceSessionTime);
  }

  template<typename Unit, typename R = int>
  R SessionTimeToDurationCount(double sourceSessionTimeValue) {
    std::chrono::microseconds sourceSessionTime(static_cast<std::size_t>(std::floor(sourceSessionTimeValue * 1000000.0)));
    return std::chrono::duration_cast<Unit>(sourceSessionTime).count();
  }

  inline int SessionTimeToMillis(double sourceSessionTimeValue) {
    return SessionTimeToDurationCount<std::chrono::milliseconds, int>(sourceSessionTimeValue);
  }
}