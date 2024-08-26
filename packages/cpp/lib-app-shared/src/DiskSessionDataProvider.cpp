//
// Created by jglanz on 1/28/2024.
//


#include <cstdio>
#include <iostream>
#include <utility>

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/SDK/Utils/ThreadHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/DiskSessionDataProvider.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SessionDataAccess.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>
#include <rpc/Events/SessionEvent.pb.h>
#include <spdlog/spdlog.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;

  namespace {
    auto L = Logging::GetCategoryWithType<DiskSessionDataProvider>();
  }


  DiskSessionDataProvider::DiskSessionDataProvider(const std::filesystem::path &file,ClientId clientId)
      : clientId_(clientId), file_(file), diskClient_(std::make_shared<DiskClient>(file, clientId)),
        dataAccess_(std::make_unique<SessionDataAccess>(diskClient_->getProvider())) {

    std::scoped_lock lock(diskClientMutex_);

    auto &diskClient = *diskClient_;

    L->info("Disk client opened {}: ready={},sampleCount={}",file.string(),diskClient.isFileOpen(),diskClient.getSampleCount());

    sessionData_ = std::make_shared<Models::Session::SessionData>();
    auto timing = sessionData_->mutable_timing();
    timing->set_is_live(false);
    timing->set_is_valid(false);

    auto sampleCount = diskClient_->getSampleCount();
    auto totalTimeMillisDouble = (static_cast<double>(sampleCount) / 60.0) * 1000.0;

    timing->set_total_time_millis(std::floor(totalTimeMillisDouble));
    timing->set_sample_index(0);
    timing->set_sample_count(sampleCount);

    auto fileInfo = sessionData_->mutable_file_info();

    VRK_LOG_AND_FATAL_IF(!Utils::GetFileInfo(fileInfo, file).has_value(), "Unable to get file info for {}", file.string());

    sessionData_->set_id(file.string());
    sessionData_->set_type(Models::Session::SESSION_TYPE_DISK);
    sessionData_->set_status(Models::Session::SESSION_STATUS_READY);

    auto sessionInfo = diskClient.getSessionInfo().lock();

    VRK_LOG_AND_FATAL_IF(!Utils::GetSessionInfoTrackLayoutMetadata(sessionData_->mutable_track_layout_metadata(), sessionInfo.get()).has_value(), "Unable to populate track layout metadata for {}", file.string());

  }


  DiskSessionDataProvider::~DiskSessionDataProvider() {
    DiskSessionDataProvider::stop();
  }

  /**
   * @brief Retrieve `SessionDataAccess` context
   * @return `SessionDataAccess` context
   */
  SessionDataAccess& DiskSessionDataProvider::dataAccess() {
    return *dataAccess_;
  }

  /**
   * @brief returns a true if this is a live session, THIS IMPL IS NOT
   *
   * @return Is live session or not
   */
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
      {
        std::unique_lock threadLock(threadMutex_);
        if (!running_)
          break;

        if (paused_) {
          pausedCondition_.wait(threadLock, [&] {
            return !paused_ || !running_;
          });

          continue;
        }
      }

      {
        std::scoped_lock lock(diskClientMutex_);

        if (!diskClient.next()) {
          L->debug("Unable to get next: {}",diskClient.getSampleIndex());
          break;
        }
      }

      auto posCountRes = diskClient.getVarCount(KnownVarName::CarIdxPosition);
      auto sessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);

      updateTiming();

      if (!sessionTimeVal) {
        L->error("No session time");
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

      long long int sessionMillis = SDK::Utils::SessionTimeToMillis(sessionTime);
      SessionTime sessionDuration{sessionMillis};

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
//        L->info << std::format("Session Time: {:%H}:{:%M}:{:%S}.{:03d}\t\tCar Pos Count: {}", sessionDuration,
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
    // publish(std::make_shared<SessionDataUpdatedDataEvent>(SessionDataEventType::UpdatedData, dataAccess_.get()));
    auto ev = createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME);
    publish(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME, ev);
  }

  void DiskSessionDataProvider::checkConnection() {
    auto isAvailable = diskClient_->isAvailable();
    if (isAvailable_ == isAvailable)
      return;

    //****Note, put your connection handling here
    isAvailable_ = isAvailable;
    publish(Models::RPC::Events::SESSION_EVENT_TYPE_AVAILABLE, createEventData(Models::RPC::Events::SessionEventType::SESSION_EVENT_TYPE_AVAILABLE));
  }

  std::shared_ptr<Models::RPC::Events::SessionEventData> DiskSessionDataProvider::createEventData(Models::RPC::Events::SessionEventType type) {
    auto data = sessionData();
    auto ev = std::make_shared<Models::RPC::Events::SessionEventData>();
    ev->set_id(Common::NewUUID());
    ev->set_type(type);
    ev->set_session_id(data->id());
    ev->set_session_type(Models::Session::SESSION_TYPE_DISK);
    ev->mutable_session_data()->CopyFrom(*data);

    return ev;
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
    std::scoped_lock lock(threadMutex_);
    if (!paused_.exchange(false))
      return true;

    pausedCondition_.notify_all();
    return true;
  }

  std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> DiskSessionDataProvider::sessionInfo() {
    return diskClient_->getSessionInfo().lock();
  }

  bool DiskSessionDataProvider::pause() {
    std::scoped_lock lock(threadMutex_);
    paused_.exchange(true);
    return true;
  }

  bool DiskSessionDataProvider::isPaused(){
    return paused_;
  }

  bool DiskSessionDataProvider::start() {
    std::scoped_lock lock(threadMutex_);
    if (running_.exchange(true) || thread_) {
      L->error("Already started");
      return true;
    }

    thread_ = std::make_unique<std::thread>(&DiskSessionDataProvider::runnable, this);
    SDK::Utils::SetThreadName(thread_.get(), std::format("DiskSessionDataProvider({})", file_.string()));

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

  const Models::Session::SessionTiming* DiskSessionDataProvider::updateTiming() {
    std::scoped_lock lock(diskClientMutex_);

    auto timing = sessionData_->mutable_timing();
    auto idx = diskClient_->getSampleIndex();

    timing->set_sample_index(idx);


    auto sessionTimeVal = diskClient_->getVarDouble(KnownVarName::SessionTime);
    std::int64_t sessionMillis = SDK::Utils::SessionTimeToMillis(sessionTimeVal.value());
    timing->set_current_time_millis(sessionMillis);


    return &sessionData_->timing();
  }



  std::shared_ptr<Models::Session::SessionData> DiskSessionDataProvider::sessionData() {
    std::scoped_lock lock(diskClientMutex_);
    return sessionData_;
  }

}// namespace IRacingTools::Shared
