//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>
#include <iostream>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/SessionDataProvider.h>


namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;


  //SessionDataAccess::SessionDataAccess(const SDK::ClientId &clientId) : clientId_(clientId) {}
  SessionDataAccess::SessionDataAccess(std::weak_ptr<Client> client): client_(client) {
  }
  //SessionDataAccess::SessionDataAccess(const SDK::ClientIdProvider &clientIdProvider) :
  //    clientIdProvider_(clientIdProvider) {}

  std::shared_ptr<SessionDataEvent> SessionDataAccess::createDataEvent() {
    return std::make_shared<SessionDataEvent>(SessionDataEventType::Data, this);
  }

  std::shared_ptr<Client> SessionDataAccess::getClient() {
    auto tmp = client_.lock();
    return tmp;
  }

#define IRVAR(Name) dataAccess_->Name

  void SessionDataEvent::refresh() {
    auto &lapVar = IRVAR(CarIdxLap);
    auto &lapsCompletedVar = IRVAR(CarIdxLapCompleted);
    auto &posVar = IRVAR(CarIdxPosition);
    auto &clazzPosVar = IRVAR(CarIdxClassPosition);
    auto &estTimeVar = IRVAR(CarIdxEstTime);
    auto &lapPercentCompleteVar = IRVAR(CarIdxLapDistPct);
    cars_.clear();

    for (int index = 0; index < Resources::MaxCars; index++) {
      auto trackSurface = IRVAR(CarIdxTrackSurface).getInt(index);

      auto lap = lapVar.getInt(index);
      auto pos = posVar.getInt(index);

      if (trackSurface == -1 || lap == -1 || pos == 0) {
        continue;
      }

      cars_.emplace_back(
          SessionCarState{.index = index, .lap = lapVar.getInt(index), .lapsCompleted = lapsCompletedVar.getInt(index), .lapPercentComplete = lapPercentCompleteVar.getFloat(
              index
          ), .estimatedTime = estTimeVar.getFloat(index), .position = {.overall = posVar.getInt(index), .clazz = clazzPosVar.getInt(
              index
          )}}
      );
    }
  }

  const std::vector<SessionDataEvent::SessionCarState> &SessionDataEvent::cars() {
    return cars_;
  }

  SessionDataEvent::SessionDataEvent(SessionDataEventType type, SessionDataAccess *dataAccess) :
      dataAccess_(dataAccess) {
    refresh();
  }

  SessionDataEventType SessionDataEvent::type() {
    return type_;
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
    auto event = std::make_shared<SessionDataEvent>(SessionDataEventType::Data, &dataAccess_);

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
  }

  bool LiveSessionDataProvider::processYAMLLiveString() {
    bool wasUpdated = false;

    //****Note, your code goes here
    // can write to disk, parse, etc

    // output file once every 1 seconds
    const auto minTime = static_cast<DWORD>(1000);
    const auto curTime = timeGetTime(); // millisecond resolution
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

  DiskSessionDataProvider::DiskSessionDataProvider(const std::string &clientId, const std::filesystem::path &file) :
      clientId_(clientId), file_(file), diskClient_(std::make_shared<SDK::DiskClient>(file)), dataAccess_(std::make_unique<SessionDataAccess>(diskClient_)) {
    //[&]() {return file_.string();})) {
    std::scoped_lock lock(diskClientMutex_);
    auto &diskClient = *diskClient_.get();

    std::cout
        << "Disk client opened "
        << file.string()
        << ": ready="
        << diskClient.isFileOpen()
        << ",sampleCount="
        << diskClient.getSampleCount()
        << std::endl;
  }

  void DiskSessionDataProvider::runnable() {
    std::chrono::milliseconds previousSessionDuration{0};
    std::chrono::milliseconds previousTimeMillis = TimeEpoch();
    std::chrono::milliseconds lastPrintTime{0};


    while (true) {
      std::scoped_lock lock(diskClientMutex_);
      auto &diskClient = *diskClient_.get();
      {
        std::scoped_lock lock(threadMutex_);
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


      long long int sessionMillis = std::floor(sessionTime * 1000.0);
      std::chrono::milliseconds sessionDuration{sessionMillis};
      long long int millis = sessionMillis % 1000;
      auto intervalDuration = sessionDuration - previousSessionDuration;

      if (previousSessionDuration.count()) {
        auto currentTimeMillis = TimeEpoch();

        if (posCount > 0) {
          auto targetTimeMillis = !previousTimeMillis.count() ? currentTimeMillis : (previousTimeMillis +
                                                                                     intervalDuration);
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

      if (posCount > 0 && TimeEpoch() - lastPrintTime > 999ms) {
        std::cout << std::format(
            "Session Time: {:%H}:{:%M}:{:%S}.{:03d}\t\tCar Pos Count: {}",
            sessionDuration,
            sessionDuration,
            sessionDuration,
            millis,
            posCount
        ) << "\n";
        std::flush(std::cout);
        lastPrintTime = TimeEpoch();
      }

      process();
    }

  }

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

  void DiskSessionDataProvider::processData() {
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

  void DiskSessionDataProvider::process() {
    // wait up to 16 ms for start of session or new data
    processData();

    // pump our connection status
    checkConnection();
  }

  void DiskSessionDataProvider::processDataUpdate() {
    auto event = dataAccess_->createDataEvent();//std::make_shared<SessionDataEvent>(SessionDataEventType::Data, dataAccess_.get());

    publish(event);
    //emit sessionUpdated(event);
  }

  void DiskSessionDataProvider::checkConnection() {
    auto isAvailable = diskClient_->isAvailable();
    if (isAvailable_ == isAvailable)
      return;

    //****Note, put your connection handling here
    isAvailable_ = isAvailable;
  }

  bool DiskSessionDataProvider::processYAMLLiveString() {
    bool wasUpdated = false;

    //****Note, your code goes here
    // can write to disk, parse, etc

    // output file once every 1 seconds
    const auto minTime = static_cast<DWORD>(1000);
    const auto curTime = timeGetTime(); // millisecond resolution
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

  DiskSessionDataProvider::~DiskSessionDataProvider() {
    stop();
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
} // namespace IRacingTools::Shared
