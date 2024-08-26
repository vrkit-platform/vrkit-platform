#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Utils {
  class Controllable {


  public:
    Controllable() = default;

    virtual ~Controllable() = default;

    /**
     * @brief Initialize the service
     */
    virtual std::expected<bool, SDK::GeneralError> init() = 0;

    /**
     * @brief Must set running == true in overridden implementation
     */
    virtual std::expected<bool, SDK::GeneralError> start() = 0;

    virtual std::optional<SDK::GeneralError> destroy() = 0;
  };

}// namespace IRacingTools::Shared::Utils