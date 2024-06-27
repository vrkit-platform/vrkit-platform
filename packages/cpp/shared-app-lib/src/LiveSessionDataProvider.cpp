//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>
#include <spdlog/spdlog.h>

#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/LiveSessionDataProvider.h>
#include <IRacingTools/Shared/SessionDataAccess.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;

  void LiveSessionDataProvider::runnable() {
    init();
    while (true) {
      {
        std::scoped_lock lock(threadMutex_);
        if (!running_)
          break;
      }
      process();
    }
  }

  /**
   * @brief Initialize the live session data provider
   */
  void LiveSessionDataProvider::init() {
    std::scoped_lock lock(threadMutex_);
    if (!running_) {
      return;
    }

    // bump priority up so we get time from the sim
    SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

    // ask for 1ms timer so sleeps are more precise
    timeBeginPeriod(1);
  }

  /**
   * @brief Process newly received data frame
   * 
   */
  void LiveSessionDataProvider::processData() {
    auto& client = LiveClient::GetInstance();
    if (client.wasSessionInfoUpdated()) {
      spdlog::info("SessionInfoUpdated (updateCount={})", client.getSessionInfoUpdateCount().value());
      publish(std::make_shared<SessionDataUpdatedInfoEvent>(client.getSessionInfo()));    
    }
    
    publish(std::make_shared<SessionDataUpdatedDataEvent>(SessionDataEventType::UpdatedData, &dataAccess_));
    
  }

  void LiveSessionDataProvider::process() {
    // wait up to 16 ms for start of session or new data
    if (LiveClient::GetInstance().waitForData(16)) {
      processData();
    }
    // pump our connection status
    checkConnection();
  }


  void LiveSessionDataProvider::checkConnection() {
    auto isConnected = LiveClient::GetInstance().isConnected();
    if (isConnected_ == isConnected)
      return;

    //    if (isConnected) {
    //        qDebug() << "Connected to iRacing";
    //        //            resetState(true);
    //    } else
    //        qDebug() << "Disconnected to iRacing";

    //****Note, put your connection handling here
    isConnected_ = isConnected;
    publish(std::make_shared<SessionDataEvent>(SessionDataEventType::Available));
  }

  bool LiveSessionDataProvider::isLive() const {
    return true;
  }

  bool LiveSessionDataProvider::isRunning() {
    return running_.load();
  }

  LiveSessionDataProvider::~LiveSessionDataProvider() {
    stop();
  }

  bool LiveSessionDataProvider::start() {
    std::scoped_lock lock(threadMutex_);
    if (running_.exchange(true) || thread_) {
      return true;
    }

    thread_ = std::make_unique<std::thread>(&LiveSessionDataProvider::runnable, this);
    return running_;
  }

  void LiveSessionDataProvider::stop() {
    if (!running_ && !thread_)
      return;
    {
      std::scoped_lock lock(threadMutex_);
      running_ = false;
    }
    if (!thread_) {
      return;
    }

    if (thread_->joinable()) {
      thread_->join();
    }

    thread_.reset();
  }

  LiveSessionDataProvider::LiveSessionDataProvider() : SessionDataProvider(), dataAccess_(LiveClient::GetPtr()->getProvider()) {
  }

  bool LiveSessionDataProvider::isAvailable() {
    return isConnected_;
  }

  bool LiveSessionDataProvider::isPaused(){
    return false;
  }

  bool LiveSessionDataProvider::resume() {
    return false;
  }

  const SessionDataProvider::Timing LiveSessionDataProvider::timing() {
    return {
      .isLive = true,
      .isValid =  isAvailable()
    };
  }

  bool LiveSessionDataProvider::pause() {
    return false;
  }

}// namespace IRacingTools::Shared
