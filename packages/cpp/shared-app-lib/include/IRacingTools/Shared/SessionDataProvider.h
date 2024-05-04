//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <memory>
#include <thread>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/EventEmitter.h>
#include <IRacingTools/SDK/VarHolder.h>

#include "Chrono.h"
#include "SessionDataAccess.h"
#include "SessionDataEvent.h"

namespace IRacingTools::Shared {

  /**
   * @brief IRacing Data Service
   */
  class SessionDataProvider : public SDK::Utils::EventEmitter<std::shared_ptr<SessionDataEvent>> {


  public:
    using SessionDataProviderPtr = std::shared_ptr<SessionDataProvider>;

    /**
     * Get the current provider
     *
     * @return current provider
     */
    static SessionDataProviderPtr GetCurrent();

    /**
     * Set the current provider & return any previously set provider
     *
     * @param next provider to set as current
     * @return If a previous provider had been set, then it is returned (after being stopped)
     */
    static SessionDataProviderPtr SetCurrent(const SessionDataProviderPtr& next);


    /**
     * Timing details for the given session
     */
    struct Timing {

      using Unit = std::chrono::milliseconds;
      using Time = std::chrono::time_point<std::chrono::steady_clock, Unit>;

      bool isLive{false};
      bool isValid{false};
      Time start{};
      Time end{};
      Unit duration{0};
      Unit position{0};
    };

    using Ptr = std::shared_ptr<SessionDataProvider>;

    virtual ~SessionDataProvider() = default;

    virtual bool isAvailable() = 0;

    virtual bool start() = 0;
    virtual void stop() = 0;

    virtual bool isRunning() = 0;

    virtual bool isControllable() const = 0;

    virtual bool isLive() const = 0;

    virtual bool isPaused() = 0;
    virtual bool pause() = 0;
    virtual bool resume() = 0;

    /**
     * @brief Get current timing state
     *
     * When timing is updated, `SessionDataEvent::Updated` is fired
     *
     * @return current timing ref
     */
    virtual const Timing timing() = 0;


  };


}// namespace IRacingTools::Shared
