//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <memory>
#include <thread>

#include "SessionDataProvider.h"

namespace IRacingTools::Shared {


  class LiveSessionDataProvider : public SessionDataProvider {

  public:
    LiveSessionDataProvider();

    virtual ~LiveSessionDataProvider() override;

    bool isAvailable() override;
    bool start() override;

    bool isRunning() override;

    void stop() override;

    virtual bool isControllable() const override {
      return false;
    };

    virtual bool isPaused() override;
    virtual bool pause() override;
    virtual bool resume() override;

    virtual const Timing timing() override;

  protected:
    void runnable();

  private:
    /**
     * @brief Initialize, this internal & invoked from the runnable call
     */
    void init();

    /**
     * @brief Called on each data sample/record/entry
     */
    void process();

    void processData();

    void processDataUpdate();

    bool processYAMLLiveString();

    void checkConnection();

    SessionDataAccess dataAccess_;
    std::unique_ptr<std::thread> thread_{nullptr};
    std::mutex threadMutex_{};

    std::atomic_bool running_{false};
    std::atomic_bool isConnected_{false};
    DWORD lastUpdatedTime_{0};
  };


}// namespace IRacingTools::Shared
