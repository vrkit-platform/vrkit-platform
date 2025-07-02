//
// Created by jglanz on 1/28/2024.
//


#include <iostream>
#include <utility>

#include <IRacingSDK/Utils/ChronoHelpers.h>
#include <IRacingSDK/Utils/CollectionHelpers.h>
#include <IRacingSDK/Utils/ThreadHelpers.h>

#include <IRacingTools/Models/rpc/Events/SessionEvent.pb.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/DiskSessionDataProvider.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>
#include <spdlog/spdlog.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingSDK;

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
          std::make_shared<DiskClient>(file, std::string(clientId), DiskClient::Extras())),
      file_(diskClient_->getFilePath().value()),


      options_(options.value_or(Options{})) {
    std::scoped_lock lock(diskClientMutex_);

    auto &diskClient = *diskClient_;

    L->info(
      "Disk client opened {}: ready={},sampleCount={}",
      file_.string(),
      diskClient.isFileOpen(),
      diskClient.getSampleCount());

    sessionMetadata_ = std::make_shared<Models::Session::SessionMetadata>();

    auto sampleCount = diskClient_->getSampleCount();

    auto timing = sessionMetadata_->mutable_timing();
    timing->set_is_live(false);
    timing->set_is_valid(false);

    timing->set_ticks(0);
    timing->set_tick_count(0);
    timing->set_sample_index(0);
    timing->set_sample_count(sampleCount);

    auto fileInfo = sessionMetadata_->mutable_file_info();

    VRK_LOG_AND_FATAL_IF(
      !Utils::GetFileInfo(fileInfo, file_).has_value(),
      "Unable to get file info for {}",
      file_.string());

    sessionMetadata_->set_id(file_.string());
    sessionMetadata_->set_type(Models::Session::SESSION_TYPE_DISK);
    sessionMetadata_->set_status(Models::Session::SESSION_STATUS_READY);

    auto sessionInfo = diskClient.getSessionInfo().lock();
    VRK_LOG_AND_FATAL_IF(
      !Utils::GetSessionInfoTrackLayoutMetadata(sessionMetadata_->mutable_track_layout_metadata(), sessionInfo.get()).has_value(),
      "Unable to populate track layout metadata for {}",
      file_.string());

    auto subSessions = sessionInfo->sessionInfo.sessions;
    sessionMetadata_->set_session_id(sessionInfo->weekendInfo.sessionID);
    sessionMetadata_->set_sub_count(subSessions.size());

  }


  DiskSessionDataProvider::~DiskSessionDataProvider() {
    DiskSessionDataProvider::stop();
  }

  const std::string DiskSessionDataProvider::id() {
    return file_.string();
  }

  std::shared_ptr<IRacingSDK::ClientProvider> DiskSessionDataProvider::clientProvider() {
    return diskClient_->getProvider();
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
        L->error("Failed to read first data frame");
        break;
      }

      auto currentTimeMillis = TimeEpoch();

      auto currentSessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
      VRK_LOG_AND_FATAL_IF(!currentSessionTimeVal, "No session time");
      auto currentSessionTime = currentSessionTimeVal.value();
      auto currentSessionTimeMillis = IRacingSDK::Utils::SessionTimeToMillis(currentSessionTime);

      process();
      auto hasNextDataFrame = nextDataFrame();
      if (!hasNextDataFrame) {
        if (running_) {
          L->info("Reached the last sample, resetting to the first of {}", diskClient.getSampleCount());
        }
        break;
      }

      if (!options().disableRealtimePlayback) {

        auto nextSessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
        VRK_LOG_AND_FATAL_IF(!nextSessionTimeVal, "No next session time");
        auto nextSessionTime = nextSessionTimeVal.value();
        auto nextSessionTimeMillis = IRacingSDK::Utils::SessionTimeToMillis(nextSessionTime);

        auto dataFrameIntervalMillis = std::chrono::milliseconds(nextSessionTimeMillis - currentSessionTimeMillis);
        auto nextTimeMillis = currentTimeMillis + dataFrameIntervalMillis;
        std::chrono::steady_clock::time_point nextTime{nextTimeMillis};

        auto nowTime = std::chrono::steady_clock::now();
        auto intervalDuration = nextTime - nowTime;
        if (intervalDuration.count() > 0)
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

  void DiskSessionDataProvider::updateSessionMetadata() {
    if (auto res = diskClient_->updateSessionInfo(nullptr, true); res.has_value() && res.value()) {
      L->info("SESSION INFO CHANGED, Firing event");
      fireMetadataChangedEvent();
    }
  }

  void DiskSessionDataProvider::updateSessionDataFrame() {
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
        auto subSessionInfo = IRacingSDK::Utils::FindValue(
          sessionInfo->sessionInfo.sessions,
          [sessionNum](auto &subInfo) {
            return subInfo.sessionNum == sessionNum;
          });
        if (subSessionInfo) {
          sessionMetadata_->set_sub_id(sessionInfo->weekendInfo.subSessionID);
          sessionMetadata_->set_sub_num(sessionNum);
          auto subSessionName = subSessionInfo.value().sessionName;

          sessionMetadata_->set_sub_type(
            subSessionName == "PRACTICE" ?
              Models::Session::SESSION_SUB_TYPE_PRACTICE :
              subSessionName == "QUALIFY" ?
              Models::Session::SESSION_SUB_TYPE_QUALIFY :
              subSessionName == "RACE" ?
              Models::Session::SESSION_SUB_TYPE_RACE :
              Models::Session::SESSION_SUB_TYPE_UNKNOWN);

        } else {
          L->warn("ERROR, SUB SESSION NUM ({}) NOT FOUND IN YAML", sessionNum);
          sessionMetadata_->set_sub_id(0);
          sessionMetadata_->set_sub_num(0);
          sessionMetadata_->set_sub_type(Models::Session::SESSION_SUB_TYPE_UNKNOWN);
        }
      }
    }
  }


  void DiskSessionDataProvider::process() {
    checkConnection();
    updateSessionTiming();
    updateSessionMetadata();
    updateSessionDataFrame();
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

  void DiskSessionDataProvider::fireMetadataChangedEvent() {

    publish(Models::RPC::Events::SESSION_EVENT_TYPE_METADATA_CHANGED, clientProvider(), shared_from_this());
  }

  void DiskSessionDataProvider::fireDataUpdatedEvent() {
    publish(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME, clientProvider(), shared_from_this());
  }

  void DiskSessionDataProvider::checkConnection() {
    auto isAvailable = diskClient_->isAvailable();
    if (isAvailable_ == isAvailable)
      return;

    //****Note, put your connection handling here
    isAvailable_ = isAvailable;
    fireSessionChangedEvent();
  }

  std::shared_ptr<Models::RPC::Events::SessionEventData> DiskSessionDataProvider::getSessionEventData(
    Models::RPC::Events::SessionEventType type) {
//    static std::array<Models::RPC::Events::SessionEventType, 2> sMetadataIncludeTypes {
//      Models::RPC::Events::SESSION_EVENT_TYPE_METADATA_CHANGED,
//      Models::RPC::Events::SESSION_EVENT_TYPE_SESSION_CHANGED
//    };
    auto metadata = sessionMetadata_;
    auto ev = std::make_shared<Models::RPC::Events::SessionEventData>();
    ev->set_type(type);
    ev->set_session_id(metadata->id());
    ev->set_session_type(Models::Session::SESSION_TYPE_DISK);

    switch(type) {
      case Models::RPC::Events::SESSION_EVENT_TYPE_SESSION_CHANGED: {
        auto data = ev->mutable_session_changed_event();
        data->set_is_available(isAvailable_);
        data->set_session_id(metadata->session_id());
        data->mutable_session_metadata()->CopyFrom(*metadata);
        break;
      }
      case Models::RPC::Events::SESSION_EVENT_TYPE_METADATA_CHANGED: {
        ev->mutable_session_metadata()->CopyFrom(*metadata);
        break;
      }
      case Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME: {
        break;
      }
      default:
        L->warn("Unknown event type {}", std::string{magic_enum::enum_name(type)});
        return nullptr;
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

  std::shared_ptr<IRacingSDK::SessionInfo::SessionInfoMessage> DiskSessionDataProvider::sessionInfo() {
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
    IRacingSDK::Utils::SetThreadName(thread_.get(), std::format("DiskSessionDataProvider({})", file_.string()));

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

  bool DiskSessionDataProvider::seekToSubSession(std::int32_t subSessionNum) {
    return isAvailable() && diskClient_->seekToSessionNum(subSessionNum);
  }

  bool DiskSessionDataProvider::isAvailable() {
    return diskClient_->isAvailable();
  }


  bool DiskSessionDataProvider::updateSessionTiming() {
    std::scoped_lock lock(diskClientMutex_);

    auto timing = sessionMetadata_->mutable_timing();
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
          if (sessionSub.sessionNum != sessionNum) {
            continue;
          }

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
            break;
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
          std::int64_t timeMillis = IRacingSDK::Utils::SessionTimeToMillis(sessionTimeVal.value());
          std::int64_t timeRemainMillis = IRacingSDK::Utils::SessionTimeToMillis(sessionTimeRemainVal.value());

          timing->set_session_sub_lap(sessionLap);
          timing->set_session_sub_lap_remaining(sessionLapsRemainVal.value());

          timing->set_session_sub_time(timeMillis);
          timing->set_session_sub_time_remaining(timeRemainMillis);
          timing->set_session_sub_time_total(timeRemainMillis + timeMillis);
        }
      }
    }
    return found;
  }

  std::size_t DiskSessionDataProvider::sampleIndex() {
    return diskClient_->getSampleIndex();
  }

  std::size_t DiskSessionDataProvider::sampleCount() {
    return diskClient_->getSampleCount();
  }

  std::shared_ptr<Models::Session::SessionMetadata> DiskSessionDataProvider::getSessionMetadata(bool includeSessionInfoYaml) {
    std::scoped_lock lock(diskClientMutex_);
    if (includeSessionInfoYaml && diskClient_ && sessionMetadata_) {

      auto res = diskClient_->getSessionInfoStr();
      if (res) {
        auto& str = res.value();
        sessionMetadata_->set_session_info_yaml(str);
      }
    }
    return sessionMetadata_;
  }

  const Models::Session::SessionTiming DiskSessionDataProvider::getSessionTiming() {
    auto metadata = getSessionMetadata();
    if (!metadata)
      return Models::Session::SessionTiming();
    return metadata->timing();
  }

  const IRacingSDK::VarHeaders &DiskSessionDataProvider::getDataVariableHeaders() {
    return diskClient_->getVarHeaders();
  }

  const DiskSessionDataProvider::Options &DiskSessionDataProvider::options() {
    return options_;
  }

  void DiskSessionDataProvider::setOptions(const Options &newOptions) {
    options_ = newOptions;
  }

  void DiskSessionDataProvider::fireSessionChangedEvent()
  {
    publish(
        Models::RPC::Events::SESSION_EVENT_TYPE_SESSION_CHANGED,
        clientProvider(),
        shared_from_this()
    );
  }
} // namespace IRacingTools::Shared
