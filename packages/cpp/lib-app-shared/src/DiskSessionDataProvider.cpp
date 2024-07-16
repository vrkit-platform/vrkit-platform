//
// Created by jglanz on 1/28/2024.
//


#include <cstdio>
#include <iostream>
#include <utility>

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/DiskSessionDataProvider.h>
#include <IRacingTools/Shared/SessionDataAccess.h>
#include <spdlog/spdlog.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;


  DiskSessionDataProvider::DiskSessionDataProvider(const std::filesystem::path &file,ClientId clientId)
      : clientId_(clientId), file_(file), diskClient_(std::make_shared<DiskClient>(file, clientId)),
        dataAccess_(std::make_unique<SessionDataAccess>(diskClient_->getProvider())) {

    std::scoped_lock lock(diskClientMutex_);

    auto &diskClient = *diskClient_;

    spdlog::info("Disk client opened {}: ready={},sampleCount={}",file.string(),diskClient.isFileOpen(),diskClient.getSampleCount());

    timing_ = std::make_unique<Timing>(Timing{.isLive = false, .isValid = false});
  }


  DiskSessionDataProvider::~DiskSessionDataProvider() {
    DiskSessionDataProvider::stop();
  }

  bool DiskSessionDataProvider::isLive() const {
    return false;
  }

  /**
   * @inherit
   */
  void DiskSessionDataProvider::runnable() {
    std::chrono::milliseconds previousSessionDuration{0};
    std::chrono::milliseconds previousTimeMillis = TimeEpoch();
    std::chrono::milliseconds lastPrintTime{0};
    auto &diskClient = *diskClient_;


    while (true) {
      std::scoped_lock lock(diskClientMutex_);

      {
        std::scoped_lock threadLock(threadMutex_);
        if (!running_)
          break;

        if (!diskClient.next()) {
          spdlog::debug("Unable to get next: {}",diskClient.getSampleIndex());
          break;
        }
      }

      auto posCountRes = diskClient.getVarCount(KnownVarName::CarIdxPosition);
      auto sessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
      if (!sessionTimeVal) {
        spdlog::error("No session time");
        abort();
      }

      int posCount = 0;
      if (posCountRes) {
        for (std::size_t i = 0; i < posCountRes.value(); i++) {
          auto pos = diskClient.getVarInt("CarIdxPosition", i).value_or(-2);
          if (pos > 0) {
            posCount++;
          }
        }
      }

      auto sessionTime = sessionTimeVal.value();

      long long int sessionMillis = Utils::SessionTimeToMillis(sessionTime);
      SessionTime sessionDuration{sessionMillis};
      long long int millis = sessionMillis % 1000;
      auto intervalDuration = sessionDuration - previousSessionDuration;

      if (previousSessionDuration.count()) {
        auto currentTimeMillis = TimeEpoch();
        if (posCount > 0) {
          auto targetTimeMillis =
              !previousTimeMillis.count() ? currentTimeMillis : (previousTimeMillis + intervalDuration);
          if (targetTimeMillis > currentTimeMillis) {
            auto sleepTimeMillis = targetTimeMillis - currentTimeMillis;
            std::this_thread::sleep_for(sleepTimeMillis);
          }
          previousTimeMillis = targetTimeMillis;
        } else {
          previousTimeMillis = currentTimeMillis;
        }
      }

      previousSessionDuration = sessionDuration;

//      if (posCount > 0 && TimeEpoch() - lastPrintTime > 999ms) {
//        spdlog::info << std::format("Session Time: {:%H}:{:%M}:{:%S}.{:03d}\t\tCar Pos Count: {}", sessionDuration,
//                                 sessionDuration, sessionDuration, millis, posCount)
//                  << "\n";
//        std::flush(std::cout);
//        lastPrintTime = TimeEpoch();
//      }
      if (posCount)
        process();
    }
  }

  /**
   * @inherit
   */
  void DiskSessionDataProvider::init() {
    std::scoped_lock lock(threadMutex_);
    if (!running_) {
      return;
    }

    // bump priority up so we get time from the sim
    SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

    // ask for 1ms timer so sleeps are more precise
    timeBeginPeriod(1);
  }


  void DiskSessionDataProvider::process() {
    fireDataUpdatedEvent();
    // processYAMLLiveString();

    //    if (processYAMLLiveString())
    //        wasUpdated = true;
    //
    //    // only process session string if it changed
    //    if (client.wasSessionInfoUpdated()) {
    //        wasUpdated = true;
    //    }

    // pump our connection status
    checkConnection();
  }

  void DiskSessionDataProvider::fireDataUpdatedEvent() {
    publish(std::make_shared<SessionDataUpdatedDataEvent>(SessionDataEventType::UpdatedData, dataAccess_.get()));
  }

  void DiskSessionDataProvider::checkConnection() {
    auto isAvailable = diskClient_->isAvailable();
    if (isAvailable_ == isAvailable)
      return;

    //****Note, put your connection handling here
    isAvailable_ = isAvailable;
    publish(std::make_shared<SessionDataEvent>(SessionDataEventType::Available));
  }

  bool DiskSessionDataProvider::processYAMLLiveString() {
    bool wasUpdated = false;

    //****Note, your code goes here
    // can write to disk, parse, etc

    // output file once every 1 seconds
    const auto minTime = static_cast<DWORD>(1000);
    const auto curTime = timeGetTime();// millisecond resolution
    if (abs(static_cast<long long>(curTime - lastUpdatedTime_)) > minTime) {
      lastUpdatedTime_ = curTime;
      wasUpdated = true;
      //        qDebug() << "Updated session str at: " << curTime;
      //        const char* yamlStr = generateLiveYAMLString();
      //        // validate string
      //        if (yamlStr && yamlStr[0])
      //        {
      //            FILE* f = fopen("liveStr.txt", "w");
      //            if (f)
      //            {
      //                fputs(yamlStr, f);
      //                fclose(f);
      //                f = nullptr;
      //                wasUpdated = true;
      //            }
      //        }
    }

    return wasUpdated;
  }

  bool DiskSessionDataProvider::isRunning() {
    return running_.load();
  }

  bool DiskSessionDataProvider::resume() {
    return false;
  }

  bool DiskSessionDataProvider::pause() {
    std::scoped_lock lock(threadMutex_);
    if (paused_)
      return true;

    paused_ = true;
    return false;
  }

  bool DiskSessionDataProvider::isPaused(){
    return paused_;
  }

  bool DiskSessionDataProvider::start() {
    std::scoped_lock lock(threadMutex_);
    if (running_.exchange(true) || thread_) {
      spdlog::error("Already started");
      return true;
    }

    thread_ = std::make_unique<std::thread>(&DiskSessionDataProvider::runnable, this);
    return running_;
  }

  void DiskSessionDataProvider::stop() {
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

  bool DiskSessionDataProvider::isAvailable() {
    return diskClient_->isAvailable();
  }

  void DiskSessionDataProvider::updateTiming() {
    std::scoped_lock lock(diskClientMutex_);

    auto &diskClient = *diskClient_;

  }

  const SessionDataProvider::Timing DiskSessionDataProvider::timing() {
    std::scoped_lock lock(diskClientMutex_);
    return timing_ ? *timing_ : Timing{};
  }

}// namespace IRacingTools::Shared
