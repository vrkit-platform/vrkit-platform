#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <cassert>
#include <expected>
#include <memory>

#include <magic_enum/magic_enum.hpp>

#include <IRacingSDK/ErrorTypes.h>

namespace VRKit::Shared::Services {
  namespace E = magic_enum;
  enum class ServiceState : uint32_t {
    Created = 0,
    Initializing = 4,
    Initialized = 5,
    Starting = 9,
    Running = 10,
    Destroying = 14,
    Destroyed = 15,
    Error = 50,
  };

  constexpr auto ServiceStateValues = E::enum_values<ServiceState>();
  constexpr auto ServiceStateNames = E::enum_names<ServiceState>();
  constexpr auto ServiceStateEntries = E::enum_entries<ServiceState>();

  inline bool ServiceStateTransitionCheck(ServiceState from, ServiceState to, bool skipAssert = false) {
    auto changeValid = E::enum_underlying(to) > E::enum_underlying(from);
    if (!skipAssert) {
      assert((changeValid, "Invalid State Transition"));
    }
    return changeValid;
  }

}// namespace VRKit::Shared::Services