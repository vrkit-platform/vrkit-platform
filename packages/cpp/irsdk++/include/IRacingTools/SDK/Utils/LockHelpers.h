//
// Created by jglanz on 4/24/2024.
//

#pragma once

#include <cstdio>
#include <functional>
#include <optional>

namespace IRacingTools::SDK::Utils {

  struct Lockable {
    virtual void lock() = 0;
    virtual bool try_lock()= 0;
    virtual void unlock()= 0;
  };

}