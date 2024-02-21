#pragma once

#include <chrono>

namespace IRacingTools::Shared {

template<typename U = std::chrono::milliseconds>
U TimeEpoch() {
    return std::chrono::duration_cast<U>(
        std::chrono::steady_clock::now().time_since_epoch());
}

}