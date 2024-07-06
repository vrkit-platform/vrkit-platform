//
// Created by jglanz on 4/24/2024.
//

#pragma once

#include <cstdio>
#include <functional>
#include <optional>

namespace IRacingTools::SDK::Utils {

  class ScopedGuard final {
  private:
    std::optional<std::function<void()>> callback_;

  public:
    ScopedGuard(std::function<void()> f);
    ~ScopedGuard() noexcept;

    void abandon();

    ScopedGuard(const ScopedGuard& other) = delete;
    ScopedGuard& operator=(const ScopedGuard&) = delete;
  };

}