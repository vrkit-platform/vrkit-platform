//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <memory>
#include <thread>

#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/Timer.h>

namespace IRacingTools::Shared {

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
    DiskSessionDataProvider(const std::filesystem::path &file, SDK::ClientId clientId);

    /**
     * @brief Destructor required to stop any running threads
     */
    virtual ~DiskSessionDataProvider() override;

    virtual bool isLive() const override;
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
      return true;
    };

    virtual bool isPaused() override;
    virtual bool pause() override;
    virtual bool resume() override;

    virtual const Timing timing() override;

  protected:
    void runnable();

  private:
    void init();

    void process();

    bool processYAMLLiveString();

    void checkConnection();

    void fireDataUpdatedEvent();

    void updateTiming();

    SDK::ClientId clientId_;
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

    std::unique_ptr<Timing> timing_{};
  };

}// namespace IRacingTools::Shared
