//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>

#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;


  bool SessionDataProvider::seek(std::size_t sampleIndex) {
    return false;
  }

  std::size_t SessionDataProvider::sampleIndex() {
    return 0;
  }

  std::size_t SessionDataProvider::sampleCount() {
    return 0;
  }
}// namespace IRacingTools::Shared
