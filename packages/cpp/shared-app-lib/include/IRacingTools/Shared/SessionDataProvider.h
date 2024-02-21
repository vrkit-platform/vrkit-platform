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
    using Ptr = std::shared_ptr<SessionDataProvider>;

    virtual ~SessionDataProvider() = default;

    virtual bool isAvailable() = 0;

    virtual bool start() = 0;
    virtual void stop() = 0;

    virtual bool isRunning() = 0;

    virtual bool isControllable() const = 0;

    virtual bool isPaused() = 0;
    virtual bool pause() = 0;
    virtual bool resume() = 0;
    //    HANDLE dataValidEvent_{nullptr};
  };


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


  class DiskSessionDataProvider : public SessionDataProvider {

  public:
    DiskSessionDataProvider() = delete;
    DiskSessionDataProvider(const DiskSessionDataProvider &other) = delete;
    DiskSessionDataProvider(DiskSessionDataProvider &&other) noexcept = delete;
    DiskSessionDataProvider &operator=(const DiskSessionDataProvider &other) = delete;
    DiskSessionDataProvider &operator=(DiskSessionDataProvider &&other) noexcept = delete;

    /**
     * @brief the only acceptable constructor
     */
    DiskSessionDataProvider(const std::string &clientId, const std::filesystem::path &file);

    /**
     * @brief Destructor required to stop any running threads
     */
    virtual ~DiskSessionDataProvider() override;

    /**
     * @inherit
     */
    bool isAvailable() override;

    /**
     * @inherit
     */
    bool start() override;

    /**
     * @inherit
     */
    bool isRunning() override;

    /**
     * @inherit
     */
    void stop() override;

    virtual bool isControllable() const override {
      return false;
    };

    virtual bool isPaused() override;
    virtual bool pause() override;
    virtual bool resume() override;

  protected:
    void runnable();

  private:
    void init();

    void process();

    bool processYAMLLiveString();

    void checkConnection();

    void fireDataUpdatedEvent();

    std::string clientId_;
    std::filesystem::path file_;
    std::shared_ptr<SDK::DiskClient> diskClient_;
    std::unique_ptr<SessionDataAccess> dataAccess_;

    std::unique_ptr<std::thread> thread_{nullptr};
    std::mutex threadMutex_{};
    std::condition_variable threadProcessCondition_{};

    std::mutex diskClientMutex_{};

    std::atomic_bool paused_{false};
    std::atomic_bool running_{false};
    std::atomic_bool isAvailable_{false};
    DWORD lastUpdatedTime_{0};
    //    HANDLE dataValidEvent_{nullptr};
  };

}// namespace IRacingTools::Shared
