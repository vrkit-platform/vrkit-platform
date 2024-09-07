#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <chrono>

namespace IRacingTools::Shared {

  template<typename U = std::chrono::milliseconds, typename Clock = std::chrono::steady_clock>
  U TimeEpoch() {
    return std::chrono::duration_cast<U>(
        Clock::now().time_since_epoch());
  }

  template<typename Duration = std::chrono::seconds>
  Duration toDuration(FILETIME ft) {
    auto datetime = winrt::clock::from_file_time(ft);
    time_t seconds = winrt::clock::to_time_t(datetime);

    auto secondsDuration = std::chrono::seconds{seconds};
    if constexpr (std::is_same_v<Duration, std::chrono::seconds>) {
      return secondsDuration;
    }
    return duration_cast<Duration>(secondsDuration);
  };

  template<typename TP>
  int64_t ToSeconds(const TP& tp) {
    return std::chrono::duration_cast<std::chrono::seconds>(tp.time_since_epoch()).count();
    //tp.time_since_epoch().count() ;
  }


} // namespace IRacingTools::Shared