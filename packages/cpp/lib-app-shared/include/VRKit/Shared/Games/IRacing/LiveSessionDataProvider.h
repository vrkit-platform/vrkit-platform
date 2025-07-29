//
// Created by jglanz on 1/28/2024.
//

#pragma once



#include <memory>
#include <thread>

#include <VRKit/Shared/SharedAppLibPCH.h>
#include "SessionDataProvider.h"

namespace VRKit::Shared::Games::IRacing {

  class LiveSessionDataProvider final : public SessionDataProvider,
                                        public std::enable_shared_from_this<LiveSessionDataProvider> {

  public:

    LiveSessionDataProvider();

    virtual ~LiveSessionDataProvider() override;

    virtual const std::string id() override;

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

    virtual std::optional<std::int32_t> sessionTicks() override;

    virtual std::optional<std::int32_t> sessionTickCount() override;

    virtual std::shared_ptr<Models::Session::SessionMetadata>
    getSessionMetadata(bool includeSessionInfoYaml = false) override;

    virtual const Models::Session::SessionTiming getSessionTiming() override;

    virtual std::shared_ptr<Models::RPC::Events::SessionEventData> getSessionEventData(
      Models::RPC::Events::SessionEventType type
    ) override;

    virtual std::string sessionInfoStr() override;

    virtual std::shared_ptr<IRacingSDK::SessionInfo::SessionInfoMessage> sessionInfo() override;

    virtual bool isLive() const override;

    virtual std::shared_ptr<IRacingSDK::ClientProvider> clientProvider() override;

    virtual const IRacingSDK::VarHeaders& getDataVariableHeaders() override;

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

    void updateSessionTiming();

    void processData();

    // void processDataUpdate();

    void checkConnection();

    std::int64_t waitForDataDuration();
    std::string id_{"LIVE"};

    std::unique_ptr<std::thread> thread_{nullptr};
    std::mutex threadMutex_{};

    std::atomic_bool running_{false};
    std::atomic_bool isConnected_{false};
    DWORD lastUpdatedTime_{0};

    std::shared_ptr<Models::Session::SessionMetadata> sessionData_{};
  };


} // namespace VRKit::Shared
