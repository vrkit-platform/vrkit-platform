//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>

#include <VRKit/Shared/Games/IRacing/SessionDataProvider.h>

namespace VRKit::Shared::Games::IRacing {
  using namespace std::chrono_literals;
  using namespace IRacingSDK;


  bool SessionDataProvider::seek(std::size_t sampleIndex) {
    return false;
  }

  std::size_t SessionDataProvider::sampleIndex() {
    return 0;
  }

  std::size_t SessionDataProvider::sampleCount() {
    return 0;
  }
}// namespace VRKit::Shared
