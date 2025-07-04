#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingSDK/ErrorTypes.h>

namespace VRKit::Shared::Utils {
  class Controllable {


  public:
    Controllable() = default;

    virtual ~Controllable() = default;

    /**
     * @brief Initialize the service
     */
    virtual std::expected<bool, IRacingSDK::GeneralError> init() = 0;

    /**
     * @brief Must set running == true in overridden implementation
     */
    virtual std::expected<bool, IRacingSDK::GeneralError> start() = 0;

    virtual std::optional<IRacingSDK::GeneralError> destroy() = 0;
  };

}// namespace VRKit::Shared::Utils