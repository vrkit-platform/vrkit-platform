//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <memory>
#include <thread>

#include <IRacingTools/Shared/SessionDataAccess.h>
#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::Shared {

  class LiveSessionDataProvider final : public SessionDataProvider {

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

    virtual std::shared_ptr<Models::Session::SessionData> sessionData() override;

    virtual std::string sessionInfoStr() override;
    virtual std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo() override;

    virtual bool isLive() const override;

    virtual SessionDataAccess& dataAccess() override;
    virtual SessionDataAccess* dataAccessPtr() override;
    virtual SDK::ClientProvider * clientProvider() override;

    virtual const SDK::VarHeaders& getDataVariableHeaders() override;

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

    void updateTiming();
    void processData();

    // void processDataUpdate();

    void checkConnection();

    std::int64_t waitForDataDuration();

    std::shared_ptr<Models::RPC::Events::SessionEventData> createEventData(Models::RPC::Events::SessionEventType type);

    SessionDataAccess dataAccess_;
    std::unique_ptr<std::thread> thread_{nullptr};
    std::mutex threadMutex_{};

    std::atomic_bool running_{false};
    std::atomic_bool isConnected_{false};
    DWORD lastUpdatedTime_{0};
    
    std::shared_ptr<Models::Session::SessionData> sessionData_{};
  };


}// namespace IRacingTools::Shared
