//
// Created by jglanz on 1/28/2024.
//

#include <IRacingTools/SDK/LiveClient.h>
#include <cstdio>

#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/SDK/Utils/ThreadHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>
#include <IRacingTools/Shared/LiveSessionDataProvider.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/SessionDataAccess.h>


namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;

  namespace {
    auto L = Logging::GetCategoryWithType<LiveSessionDataProvider>();
  }

  void LiveSessionDataProvider::runnable() {
    init();
    while (true) {
      if (!running_)
        break;
      process();
    }
  }

  /**
   * @brief Initialize the live session data provider
   */
  void LiveSessionDataProvider::init() {
    std::scoped_lock lock(threadMutex_);
  }

  /**
   * @brief Process newly received data frame
   *
   */
  void LiveSessionDataProvider::processData() {
    auto &client = LiveClient::GetInstance();

    if (client.wasSessionInfoUpdated()) {
      L->info("SessionInfoUpdated (updateCount={})", client.getSessionInfoUpdateCount().value());
      publish(
        Models::RPC::Events::SESSION_EVENT_TYPE_INFO_CHANGED,
        createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_INFO_CHANGED));
    }

    publish(
      Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME,
      createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME));
  }

  void LiveSessionDataProvider::process() {
    static auto &client = LiveClient::GetInstance();
    updateSessionTiming();

    checkConnection();

    if (client.waitForData(waitForDataDuration())) {
      processData();
    }
  }

  void LiveSessionDataProvider::updateSessionTiming() {
    static auto &client = LiveClient::GetInstance();

    auto timing = sessionData_->mutable_timing();
    if (client.isConnected()) {
      timing->set_is_valid(true);
      timing->set_ticks(client.getSessionTicks().value_or(0));
      timing->set_tick_count(-1);
      timing->set_sample_index(client.getSampleIndex());
      timing->set_sample_count(client.getSampleCount());
      timing->set_sample_index(client.getSampleIndex());

      auto sessionInfo = client.getSessionInfo().lock();
      auto sessionNumVal = client.getVarDouble(KnownVarName::SessionNum);
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
                timing->set_session_sub_type(
                  sessionSub.sessionName == "PRACTICE" ?
                    Models::Session::SESSION_SUB_TYPE_PRACTICE :
                    sessionSub.sessionName == "QUALIFY" ? Models::Session::SESSION_SUB_TYPE_QUALIFY :
                    sessionSub.sessionName == "RACE"    ? Models::Session::SESSION_SUB_TYPE_RACE :
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
          auto sessionLapVal = client.getVarInt(KnownVarName::Lap);
          auto sessionLapsRemainVal = client.getVarInt(KnownVarName::SessionLapsRemain);
          auto sessionTimeVal = client.getVarDouble(KnownVarName::SessionTime);
          auto sessionTimeRemainVal = client.getVarDouble(KnownVarName::SessionTimeRemain);

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
        }
      }
      publish(
        Models::RPC::Events::SESSION_EVENT_TYPE_TIMING_CHANGED,
        createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_TIMING_CHANGED));
    } else {
      timing->set_ticks(0);
      timing->set_tick_count(-1);
      timing->set_sample_count(0);
      timing->set_sample_index(0);
      timing->set_is_valid(false);
    }
  }


  void LiveSessionDataProvider::checkConnection() {
    auto isConnected = LiveClient::GetInstance().isConnected();

    // CHECK IF CONNECTION CHANGED
    if (isConnected_ == isConnected)
      return;

    // IF IT DID, UPDATE SUBSCRIBERS
    isConnected_ = isConnected;
    publish(
      Models::RPC::Events::SESSION_EVENT_TYPE_AVAILABLE,
      createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_AVAILABLE));
  }

  std::int64_t LiveSessionDataProvider::waitForDataDuration() {
    static auto &client = LiveClient::GetInstance();
    return isConnected_ ? LiveClient::ActiveUpdateIntervalMillis : LiveClient::InactiveUpdateIntervalMillis;
  }


  std::shared_ptr<Models::RPC::Events::SessionEventData> LiveSessionDataProvider::createEventData(
    Models::RPC::Events::SessionEventType type) {
    auto data = sessionData();
    auto ev = std::make_shared<Models::RPC::Events::SessionEventData>();
    // TODO: Revisit ID generation
    ev->set_id(std::to_string(TimeEpoch().count()));
    ev->set_type(type);
    ev->set_session_id(data->id());
    ev->set_session_type(Models::Session::SESSION_TYPE_LIVE);

    if (type != Models::RPC::Events::SESSION_EVENT_TYPE_TIMING_CHANGED) {
      ev->mutable_session_data()->CopyFrom(*data);
    } else {
      ev->mutable_session_timing()->CopyFrom(data->timing());
    }

    return ev;
  }


  bool LiveSessionDataProvider::isLive() const {
    return true;
  }

  SessionDataAccess &LiveSessionDataProvider::dataAccess() {
    return dataAccess_;
  }

  SessionDataAccess *LiveSessionDataProvider::dataAccessPtr() {
    return &dataAccess_;
  }

  SDK::ClientProvider *LiveSessionDataProvider::clientProvider() {
    return LiveClient::Get().getProvider().get();
  }

  const SDK::VarHeaders &LiveSessionDataProvider::getDataVariableHeaders() {
    return LiveClient::GetInstance().getVarHeaders();
  }

  bool LiveSessionDataProvider::isRunning() {
    return running_.load();
  }

  /**
   * @brief Clean up resources
   */
  LiveSessionDataProvider::~LiveSessionDataProvider() {
    stop();
  }

  /**
   * @brief Start processing live data if available
   *
   * @return true if either `start` was successful - OR - if the provider was already running
   */
  bool LiveSessionDataProvider::start() {
    std::scoped_lock lock(threadMutex_);
    if (running_.exchange(true) || thread_) {
      return true;
    }

    thread_ = std::make_unique<std::thread>(&LiveSessionDataProvider::runnable, this);
    Utils::SetThreadName(thread_.get(), "LiveSessionDataProvider");
    return running_;
  }


  void LiveSessionDataProvider::stop() {
    {
      std::scoped_lock lock(threadMutex_);
      if (!running_.exchange(false) || !thread_)
        return;
    }

    if (thread_->joinable()) {
      thread_->join();
    }

    thread_.reset();
  }

  LiveSessionDataProvider::LiveSessionDataProvider() :
      SessionDataProvider(),
      dataAccess_(LiveClient::GetPtr()->getProvider()) {
    sessionData_ = std::make_shared<Models::Session::SessionData>();
    auto timing = sessionData_->mutable_timing();
    timing->set_is_live(true);
    timing->set_is_valid(isAvailable());

    sessionData_->set_id(magic_enum::enum_name(Models::Session::SESSION_TYPE_LIVE).data());
    sessionData_->set_type(Models::Session::SESSION_TYPE_LIVE);
    sessionData_->set_status(Models::Session::SESSION_STATUS_READY);
  }

  bool LiveSessionDataProvider::isAvailable() {
    return isConnected_;
  }

  bool LiveSessionDataProvider::isPaused() {
    return false;
  }

  bool LiveSessionDataProvider::resume() {
    return false;
  }

  std::optional<std::int32_t> LiveSessionDataProvider::sessionTicks() {
    return LiveClient::GetInstance().getSessionTicks();
  }

  std::optional<std::int32_t> LiveSessionDataProvider::sessionTickCount() {
    return std::nullopt;
  }

  std::shared_ptr<Models::Session::SessionData> LiveSessionDataProvider::sessionData() {
    return sessionData_;
  }

  std::string LiveSessionDataProvider::sessionInfoStr() {
    if (!isAvailable())
      return "";

    auto res = LiveClient::GetInstance().getSessionInfoStr();
    if (!res) {
      L->error("Failed to get session info string: {}", res.error().what());
      return "";
    }

    return std::string{res.value()};
  }

  std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> LiveSessionDataProvider::sessionInfo() {
    auto weakInfo = LiveClient::GetInstance().getSessionInfo();

    return weakInfo.lock();
  }

  bool LiveSessionDataProvider::pause() {
    return false;
  }
} // namespace IRacingTools::Shared
