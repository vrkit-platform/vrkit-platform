//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>

#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;

  namespace {
    std::mutex gCurrentMutex{};
    SessionDataProvider::SessionDataProviderPtr gCurrent{nullptr};


  }

  SessionDataProvider::SessionDataProviderPtr SessionDataProvider::GetCurrent() {
    std::scoped_lock lock(gCurrentMutex);
    return gCurrent;
  }

  SessionDataProvider::SessionDataProviderPtr SessionDataProvider::SetCurrent(const SessionDataProviderPtr& next) {
    std::scoped_lock lock(gCurrentMutex);
    SessionDataProviderPtr previous;
    if (gCurrent) {
      gCurrent->stop();
      previous = gCurrent;
    }

    gCurrent = next;
    return previous;
  }
}// namespace IRacingTools::Shared
