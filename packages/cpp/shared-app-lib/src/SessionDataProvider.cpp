//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>
#include <iostream>
#include <utility>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/SessionDataAccess.h>
#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;

  namespace {
    int SessionTimeToMillis(double sessionTime) {
      return std::floor(sessionTime * 1000.0);
    }
  }// namespace

    SessionDataEvent::SessionDataEvent(SessionDataEventType type) : type_(type) {
  }


  SessionDataEventType SessionDataEvent::type() {
    return type_;
  }

  SessionDataUpdatedEvent::SessionDataUpdatedEvent(SessionDataEventType type, SessionDataAccess *dataAccess)
      : SessionDataEvent(type), dataAccess_(dataAccess) {
    refresh();
  }

  SessionCarStateRecord SessionDataUpdatedEvent::SessionCarState::toTuple() {
    return {index, lap, lapsCompleted, lapPercentComplete, estimatedTime, position.overall, position.clazz, driver};
  }

//  std::shared_ptr<SessionDataUpdatedEvent> SessionDataAccess::createDataEvent() {
//    return std::make_shared<SessionDataUpdatedEvent>(SessionDataEventType::Updated, this);
//  }

  std::shared_ptr<Client> SessionDataAccess::getClient() {
    return client_.lock();
  }

#define IRVAR(Name) dataAccess_->Name

  void SessionDataUpdatedEvent::refresh() {
    auto &sessionTimeVar = IRVAR(SessionTime);
    auto &lapVar = IRVAR(CarIdxLap);
    auto &lapsCompletedVar = IRVAR(CarIdxLapCompleted);
    auto &posVar = IRVAR(CarIdxPosition);
    auto &clazzPosVar = IRVAR(CarIdxClassPosition);
    auto &estTimeVar = IRVAR(CarIdxEstTime);
    auto &lapPercentCompleteVar = IRVAR(CarIdxLapDistPct);
    std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo{nullptr};
    if (auto client = dataAccess_->getClient()) {
      sessionInfo_ = client->getSessionInfo();
      sessionInfo = sessionInfo_.lock();
    }
    auto drivers = sessionInfo ? sessionInfo->driverInfo.drivers : std::vector<SDK::SessionInfo::Driver>{};
    cars_.clear();

    sessionTimeMillis_ = SessionTimeToMillis(sessionTimeVar.getDouble());

    for (int index = 0; index < Resources::MaxCars; index++) {
      auto trackSurface = IRVAR(CarIdxTrackSurface).getInt(index);

      std::optional<SDK::SessionInfo::Driver> driver =
          drivers.size() > index ? std::make_optional(drivers[index]) : std::nullopt;

      auto lap = lapVar.getInt(index);
      auto pos = posVar.getInt(index);

      if (trackSurface == -1 || lap == -1 || pos == 0) {
        continue;
      }

      cars_.emplace_back(
          SessionCarState{.index = index,
                          .lap = lapVar.getInt(index),
                          .lapsCompleted = lapsCompletedVar.getInt(index),
                          .lapPercentComplete = lapPercentCompleteVar.getFloat(index),
                          .estimatedTime = estTimeVar.getFloat(index),
                          .position = {.overall = posVar.getInt(index), .clazz = clazzPosVar.getInt(index)},
                          .driver = std::move(driver)});
    }
  }

  const std::vector<SessionDataUpdatedEvent::SessionCarState> &SessionDataUpdatedEvent::cars() {
    return cars_;
  }

  int SessionDataUpdatedEvent::sessionTimeMillis() {
    return sessionTimeMillis_;
  }

  std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> SessionDataUpdatedEvent::sessionInfo() {
    return sessionInfo_;
  }

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

  void LiveSessionDataProvider::processData() {
    //    auto &client = LiveClient::GetInstance();
    //    bool wasUpdated = false;

    // and grab the data
    processDataUpdate();
    processYAMLLiveString();

    //    if (processYAMLLiveString())
    //        wasUpdated = true;
    //
    //    // only process session string if it changed
    //    if (client.wasSessionStrUpdated()) {
    //        wasUpdated = true;
    //    }
  }

  void LiveSessionDataProvider::process() {
    // wait up to 16 ms for start of session or new data
    if (LiveClient::GetInstance().waitForData(16)) {
      processData();
    }
    // pump our connection status
    checkConnection();
  }

  void LiveSessionDataProvider::processDataUpdate() {
    auto event = std::make_shared<SessionDataUpdatedEvent>(SessionDataEventType::Updated, &dataAccess_);

    publish(event);
    //emit sessionUpdated(event);
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

  bool LiveSessionDataProvider::processYAMLLiveString() {
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

  LiveSessionDataProvider::LiveSessionDataProvider() : SessionDataProvider(), dataAccess_(LiveClient::GetPtr()) {
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

  bool LiveSessionDataProvider::pause() {
    return false;
  }

  DiskSessionDataProvider::DiskSessionDataProvider(const std::string &clientId, const std::filesystem::path &file)
      : clientId_(clientId), file_(file), diskClient_(std::make_shared<SDK::DiskClient>(file)),
        dataAccess_(std::make_unique<SessionDataAccess>(diskClient_)) {
    //[&]() {return file_.string();})) {
    std::scoped_lock lock(diskClientMutex_);
    auto &diskClient = *diskClient_.get();

    std::cout << "Disk client opened " << file.string() << ": ready=" << diskClient.isFileOpen()
              << ",sampleCount=" << diskClient.getSampleCount() << std::endl;
  }


  DiskSessionDataProvider::~DiskSessionDataProvider() {
    stop();
  }

  /**
   * @inherit
   */
  void DiskSessionDataProvider::runnable() {
    std::chrono::milliseconds previousSessionDuration{0};
    std::chrono::milliseconds previousTimeMillis = TimeEpoch();
    std::chrono::milliseconds lastPrintTime{0};

    while (true) {
      std::scoped_lock lock(diskClientMutex_);
      auto &diskClient = *diskClient_.get();
      {
        std::scoped_lock threadLock(threadMutex_);
        if (!running_)
          break;

        if (!diskClient.next()) {
          std::cerr << "Unable to get next: " << diskClient.getSampleIndex() << "\n";
          break;
        }
      }

      auto posCountRes = diskClient.getVarCount("CarIdxPosition");
      auto sessionTimeVal = diskClient.getVarDouble("SessionTime");
      if (!sessionTimeVal) {
        std::cerr << "No session time\n";
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

      long long int sessionMillis = SessionTimeToMillis(sessionTime);
      std::chrono::milliseconds sessionDuration{sessionMillis};
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
//        std::cout << std::format("Session Time: {:%H}:{:%M}:{:%S}.{:03d}\t\tCar Pos Count: {}", sessionDuration,
//                                 sessionDuration, sessionDuration, millis, posCount)
//                  << "\n";
//        std::flush(std::cout);
//        lastPrintTime = TimeEpoch();
//      }

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
    processYAMLLiveString();

    //    if (processYAMLLiveString())
    //        wasUpdated = true;
    //
    //    // only process session string if it changed
    //    if (client.wasSessionStrUpdated()) {
    //        wasUpdated = true;
    //    }

    // pump our connection status
    checkConnection();
  }

  void DiskSessionDataProvider::fireDataUpdatedEvent() {
    publish(std::make_shared<SessionDataUpdatedEvent>(SessionDataEventType::Updated, dataAccess_.get()));
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
      std::cerr << "Already started" << "\n";
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

}// namespace IRacingTools::Shared
