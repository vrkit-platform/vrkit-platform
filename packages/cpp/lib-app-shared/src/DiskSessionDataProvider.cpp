//
// Created by jglanz on 1/28/2024.
//


#include <cstdio>
#include <iostream>
#include <utility>

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/rpc/Events/SessionEvent.pb.h>
#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/ThreadHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>
#include <IRacingTools/Shared/DiskSessionDataProvider.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SessionDataAccess.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>
#include <spdlog/spdlog.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;

  namespace {
    auto L = Logging::GetCategoryWithType<DiskSessionDataProvider>();
  }


  DiskSessionDataProvider::DiskSessionDataProvider(
    const std::filesystem::path &file,
    ClientId clientId,
    const std::optional<Options> &options) :
      clientId_(clientId),
      diskClient_(
        fs::is_directory(file) ?
          DiskClient::CreateForRaceRecording(file.string()) :
          std::make_shared<DiskClient>(file, std::string(clientId), DiskClient::Extras{})),
      file_(diskClient_->getFilePath().value()),

      dataAccess_(std::make_unique<SessionDataAccess>(diskClient_->getProvider())),
      options_(options.value_or(Options{})) {
    std::scoped_lock lock(diskClientMutex_);

    auto &diskClient = *diskClient_;

    L->info(
      "Disk client opened {}: ready={},sampleCount={}",
      file_.string(),
      diskClient.isFileOpen(),
      diskClient.getSampleCount());

    sessionData_ = std::make_shared<Models::Session::SessionData>();

    auto sampleCount = diskClient_->getSampleCount();

    auto timing = sessionData_->mutable_timing();
    timing->set_is_live(false);
    timing->set_is_valid(false);

    timing->set_ticks(0);
    timing->set_tick_count(0);
    timing->set_sample_index(0);
    timing->set_sample_count(sampleCount);

    auto fileInfo = sessionData_->mutable_file_info();

    VRK_LOG_AND_FATAL_IF(
      !Utils::GetFileInfo(fileInfo, file_).has_value(),
      "Unable to get file info for {}",
      file_.string());

    sessionData_->set_id(file_.string());
    sessionData_->set_type(Models::Session::SESSION_TYPE_DISK);
    sessionData_->set_status(Models::Session::SESSION_STATUS_READY);

    auto sessionInfo = diskClient.getSessionInfo().lock();
    VRK_LOG_AND_FATAL_IF(
      !Utils::GetSessionInfoTrackLayoutMetadata(sessionData_->mutable_track_layout_metadata(), sessionInfo.get()).has_value(),
      "Unable to populate track layout metadata for {}",
      file_.string());

    auto subSessions = sessionInfo->sessionInfo.sessions;
    sessionData_->set_sub_count(subSessions.size());

    // L->warn("HACK: Skipping to SessionNum == 2 (RACE)");
    // if (!seekToSessionNum(2)) {
    //     L->error("HACK: ERROR: Failed Skipping to SessionNum == 2 (RACE)");
    // }
  }


  DiskSessionDataProvider::~DiskSessionDataProvider() {
    DiskSessionDataProvider::stop();
  }

  /**
   * @brief Retrieve `SessionDataAccess` context
   * @return `SessionDataAccess` context
   */
  SessionDataAccess &DiskSessionDataProvider::dataAccess() {
    return *dataAccess_;
  }

  SessionDataAccess *DiskSessionDataProvider::dataAccessPtr() {
    return dataAccess_.get();
  }

  SDK::ClientProvider *DiskSessionDataProvider::clientProvider() {
    return diskClient_->getProvider().get();
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
    auto &diskClient = *diskClient_;
    bool isFirst = true;

    auto nextDataFrame = [&]() -> bool {
      std::scoped_lock lock(diskClientMutex_);

      if (!diskClient.next()) {
        L->debug("Reached last sample {} of {}", diskClient.getSampleIndex(), diskClient.getSampleCount());
        return false;
      }

      if (isFirst)
        isFirst = false;

      return true;
    };

    while (true) {
      {
        std::unique_lock threadLock(threadMutex_);
        if (!running_)
          break;

        if (paused_) {
          pausedCondition_.wait(
            threadLock,
            [&] {
              return !paused_ || !running_;
            });

          continue;
        }
      }

      if (isFirst && !nextDataFrame()) {
        break;
      }

      auto currentTimeMillis = TimeEpoch();

      auto currentSessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
      VRK_LOG_AND_FATAL_IF(!currentSessionTimeVal, "No session time");
      auto currentSessionTime = currentSessionTimeVal.value();
      auto currentSessionTimeMillis = SDK::Utils::SessionTimeToMillis(currentSessionTime);

      process();

      if (!nextDataFrame()) {
        if (running_) {
          L->info("Reached the last sample, resetting to the first of {}", diskClient.getSampleCount());
        }
        break;
      }

      if (!options().disableRealtimePlayback) {

        auto nextSessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
        VRK_LOG_AND_FATAL_IF(!nextSessionTimeVal, "No next session time");
        auto nextSessionTime = nextSessionTimeVal.value();
        auto nextSessionTimeMillis = SDK::Utils::SessionTimeToMillis(nextSessionTime);

        auto dataFrameIntervalMillis = std::chrono::milliseconds(nextSessionTimeMillis - currentSessionTimeMillis);
        auto nextTimeMillis = currentTimeMillis + dataFrameIntervalMillis;
        std::chrono::steady_clock::time_point nextTime{nextTimeMillis};

        auto nowTime = std::chrono::steady_clock::now();
        auto intervalDuration = nextTime - nowTime;
        {
          std::unique_lock threadLock(threadMutex_);
          pausedCondition_.wait_for(
            threadLock,
            intervalDuration,
            [&] {
              return !running_;
            });
        }
      }
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

  void DiskSessionDataProvider::updateSessionInfo() {
    if (auto res = diskClient_->updateSessionInfo(nullptr, true); res.has_value() && res.value() == true) {
      L->info("SESSION INFO CHANGED, Firing event");
      fireInfoChangedEvent();
    }
  }

  void DiskSessionDataProvider::updateSessionData() {
    if (!isAvailable()) {
      return;
    }

    auto sessionNumRes = diskClient_->getVarInt(KnownVarName::SessionNum);
    if (!sessionNumRes) {
      L->warn("'SessionNum' data var is unavailable");
    } else {
      auto sessionNum = sessionNumRes.value();
      if (!Win32::IsWindowsMagicNumber(sessionNum)) {
        auto sessionInfo = diskClient_->getSessionInfo().lock();
        auto subSessionInfo = SDK::Utils::FindValue(
          sessionInfo->sessionInfo.sessions,
          [sessionNum](auto &subInfo) {
            return subInfo.sessionNum == sessionNum;
          });
        if (subSessionInfo) {
          sessionData_->set_sub_id(sessionInfo->weekendInfo.subSessionID);
          sessionData_->set_sub_num(sessionNum);
          auto subSessionName = subSessionInfo.value().sessionName;

          sessionData_->set_sub_type(
            subSessionName == "PRACTICE" ?
              Models::Session::SESSION_SUB_TYPE_PRACTICE :
              subSessionName == "QUALIFY" ?
              Models::Session::SESSION_SUB_TYPE_QUALIFY :
              subSessionName == "RACE" ?
              Models::Session::SESSION_SUB_TYPE_RACE :
              Models::Session::SESSION_SUB_TYPE_UNKNOWN);

        } else {
          L->warn("ERROR, SUB SESSION NUM ({}) NOT FOUND IN YAML", sessionNum);
          sessionData_->set_sub_id(0);
          sessionData_->set_sub_num(0);
          sessionData_->set_sub_type(Models::Session::SESSION_SUB_TYPE_UNKNOWN);
        }
      }
    }
  }


  void DiskSessionDataProvider::process() {
    checkConnection();
    updateSessionTiming();
    updateSessionInfo();
    updateSessionData();
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
  }

  void DiskSessionDataProvider::fireInfoChangedEvent() {
    auto ev = createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_INFO_CHANGED);
    publish(Models::RPC::Events::SESSION_EVENT_TYPE_INFO_CHANGED, ev);
  }

  void DiskSessionDataProvider::fireDataUpdatedEvent() {
    auto ev = createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME);
    publish(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME, ev);
  }

  void DiskSessionDataProvider::checkConnection() {
    auto isAvailable = diskClient_->isAvailable();
    if (isAvailable_ == isAvailable)
      return;

    //****Note, put your connection handling here
    isAvailable_ = isAvailable;
    publish(
      Models::RPC::Events::SESSION_EVENT_TYPE_AVAILABLE,
      createEventData(Models::RPC::Events::SessionEventType::SESSION_EVENT_TYPE_AVAILABLE));
  }

  std::shared_ptr<Models::RPC::Events::SessionEventData> DiskSessionDataProvider::createEventData(
    Models::RPC::Events::SessionEventType type) {
    auto data = sessionData_;
    auto ev = std::make_shared<Models::RPC::Events::SessionEventData>();
    ev->set_id(std::to_string(TimeEpoch().count()));
    ev->set_type(type);
    ev->set_session_id(data->id());
    ev->set_session_type(Models::Session::SESSION_TYPE_DISK);

    if (type != Models::RPC::Events::SESSION_EVENT_TYPE_TIMING_CHANGED) {
      ev->mutable_session_data()->CopyFrom(*data);
    } else {
      ev->mutable_session_timing()->CopyFrom(data->timing());
    }
    return ev;
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

  std::optional<std::int32_t> DiskSessionDataProvider::sessionTickCount() {
    return diskClient_->getSessionTickCount();
  }

  std::optional<std::int32_t> DiskSessionDataProvider::sessionTicks() {
    return diskClient_->getSessionTicks();
  }

  std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> DiskSessionDataProvider::sessionInfo() {
    return diskClient_->getSessionInfo().lock();
  }

  std::string DiskSessionDataProvider::sessionInfoStr() {
    auto res = diskClient_->getSessionInfoStr();
    if (!res) {
      L->error("Failed to get session info string: {}", res.error().what());
      return "";
    }

    return std::string{res.value()};
  }

  bool DiskSessionDataProvider::pause() {
    std::scoped_lock lock(threadMutex_);
    paused_.exchange(true);
    return true;
  }

  bool DiskSessionDataProvider::isPaused() {
    return paused_;
  }

  bool DiskSessionDataProvider::start() {
    std::scoped_lock lock(threadMutex_);
    if (running_.exchange(true) || thread_) {
      L->warn("Already started");
      return true;
    }

    thread_ = std::make_unique<std::thread>(&DiskSessionDataProvider::runnable, this);
    SDK::Utils::SetThreadName(thread_.get(), std::format("DiskSessionDataProvider({})", file_.string()));

    return running_;
  }

  /**
   * @brief Stop the data provider & cleanup resources
   */
  void DiskSessionDataProvider::stop() {
    if (!running_.exchange(false))
      return;


    if (!thread_) {
      return;
    }

    // If the thread is in a paused state,
    // then notify, just in case
    pausedCondition_.notify_all();

    if (thread_->joinable()) {
      thread_->join();
    }

    // thread_.reset();
  }

  bool DiskSessionDataProvider::seek(std::size_t sampleIndex) {
    if (!isAvailable() || !diskClient_->seek(sampleIndex)) {
      return false;
    }

    updateSessionTiming();
    return true;
  }

  bool DiskSessionDataProvider::seekToSessionNum(std::int32_t sessionNum) {
    return isAvailable() && diskClient_->seekToSessionNum(sessionNum);
  }

  bool DiskSessionDataProvider::isAvailable() {
    return diskClient_->isAvailable();
  }

  const Models::Session::SessionTiming *DiskSessionDataProvider::updateSessionTiming() {
    std::scoped_lock lock(diskClientMutex_);

    auto timing = sessionData_->mutable_timing();
    auto idx = diskClient_->getSampleIndex();
    auto ticks = diskClient_->getSessionTicks().value_or(0);

    timing->set_sample_index(idx);
    timing->set_sample_count(diskClient_->getSampleCount());
    timing->set_ticks(ticks);
    timing->set_tick_count(diskClient_->getSessionTickCount().value_or(-1));
    timing->set_is_valid(ticks > 0);


    auto sessionInfo = diskClient_->getSessionInfo().lock();
    auto sessionNumVal = diskClient_->getVarDouble(KnownVarName::SessionNum);
    bool found = false;
    if (sessionInfo && sessionNumVal) {
      auto sessionNum = sessionNumVal.value();
      if (sessionNum == timing->session_sub_num() && timing->session_sub_timing_type() != Models::Session::SESSION_SUB_TIMING_TYPE_UNKNOWN) {
        // SESSION NUM UN-CHANGED, NO NEED TO UPDATE SESSION SUB INFO
        found = true;
      } else {
        for (auto &sessionSub : sessionInfo->sessionInfo.sessions) {
          if (sessionSub.sessionNum == sessionNum) {
            std::regex timingTypeExp{"^(\\d+\\s*?|unlimited)$"};
            std::smatch timingTypeMatch;
            if (std::regex_search(sessionSub.sessionLaps, timingTypeMatch, timingTypeExp)) {
              found = true;
              auto str = timingTypeMatch[1].str();
              std::int32_t lapCount = str == "unlimited" ? -1 : std::stoi(str);
              auto timingType = lapCount > 0 ?
                Models::Session::SESSION_SUB_TIMING_TYPE_LAPS :
                Models::Session::SESSION_SUB_TIMING_TYPE_TIMED;
              timing->set_session_sub_type(sessionSub.sessionName == "PRACTICE" ? Models::Session::SESSION_SUB_TYPE_PRACTICE : sessionSub.sessionName == "QUALIFY" ? Models::Session::SESSION_SUB_TYPE_QUALIFY :
                                             sessionSub.sessionName == "RACE"                                                                                      ? Models::Session::SESSION_SUB_TYPE_RACE :
                                                                                                                                                                     Models::Session::SESSION_SUB_TYPE_UNKNOWN);
              timing->set_session_sub_num(sessionSub.sessionNum);
              timing->set_session_sub_timing_type(timingType);
              timing->set_session_sub_lap_count(lapCount);
            } else {
              continue;
            }
          }
        }

        timing->set_session_sub_count(sessionInfo->sessionInfo.sessions.size());
      }

      if (!found) {
        L->warn("Unable to update session timing info.  Sub session num ({}) not found or invalid", sessionNum);

      } else {

        auto sessionLapVal = diskClient_->getVarInt(KnownVarName::Lap);
        auto sessionLapsRemainVal = diskClient_->getVarInt(KnownVarName::SessionLapsRemain);
        auto sessionTimeVal = diskClient_->getVarDouble(KnownVarName::SessionTime);
        auto sessionTimeRemainVal = diskClient_->getVarDouble(KnownVarName::SessionTimeRemain);

        auto sessionLap = sessionLapVal.value_or(-1);
        if (sessionLap >= 0) {
          std::int64_t timeMillis = SDK::Utils::SessionTimeToMillis(sessionTimeVal.value());
          std::int64_t timeRemainMillis = SDK::Utils::SessionTimeToMillis(sessionTimeRemainVal.value());

          timing->set_session_sub_lap(sessionLap);
          timing->set_session_sub_lap_remaining(sessionLapsRemainVal.value());

          timing->set_session_sub_time(timeMillis);
          timing->set_session_sub_time_remaining(timeRemainMillis);
          timing->set_session_sub_time_total(timeRemainMillis + timeMillis);
        }

        publish(
          Models::RPC::Events::SESSION_EVENT_TYPE_TIMING_CHANGED,
          createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_TIMING_CHANGED));
      }
    }
    return &sessionData_->timing();
  }

  std::size_t DiskSessionDataProvider::sampleIndex() {
    return diskClient_->getSampleIndex();
  }

  std::size_t DiskSessionDataProvider::sampleCount() {
    return diskClient_->getSampleCount();
  }

  std::shared_ptr<Models::Session::SessionData> DiskSessionDataProvider::sessionData() {
    std::scoped_lock lock(diskClientMutex_);
    return sessionData_;
  }

  const SDK::VarHeaders &DiskSessionDataProvider::getDataVariableHeaders() {
    return diskClient_->getVarHeaders();
  }

  const DiskSessionDataProvider::Options &DiskSessionDataProvider::options() {
    return options_;
  }

  void DiskSessionDataProvider::setOptions(const Options &newOptions) {
    options_ = newOptions;
  }
} // namespace IRacingTools::Shared
