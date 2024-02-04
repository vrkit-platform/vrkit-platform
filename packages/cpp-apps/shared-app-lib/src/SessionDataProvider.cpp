//
// Created by jglanz on 1/28/2024.
//

#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::Shared {

using namespace IRacingTools::SDK;
SessionDataAccess::SessionDataAccess() {}
SessionDataAccess::SessionDataAccess(const SDK::ClientId &clientId) :
    SessionDataAccess(MakeStaticClientIdProvider(clientId)) {}
SessionDataAccess::SessionDataAccess(const SDK::ClientIdProvider &clientIdProvider) :
    clientIdProvider_(clientIdProvider) {}

std::shared_ptr<SessionDataEvent> SessionDataAccess::createDataEvent() {
    return std::make_shared<SessionDataEvent>(SessionDataEventType::Data, this);
}

#define IRVAR(Name) dataAccess_->Name

void SessionDataEvent::refresh() {
    static auto &lapVar = IRVAR(CarIdxLap);
    static auto &lapsCompletedVar = IRVAR(CarIdxLapCompleted);
    static auto &posVar = IRVAR(CarIdxPosition);
    static auto &clazzPosVar = IRVAR(CarIdxClassPosition);
    static auto &estTimeVar = IRVAR(CarIdxEstTime);
    static auto &lapPercentCompleteVar = IRVAR(CarIdxLapDistPct);
    cars_.clear();

    for (int index = 0; index < Resources::MaxCars; index++) {
        auto trackSurface = IRVAR(CarIdxTrackSurface).getInt(index);

        auto lap = lapVar.getInt(index);
        auto pos = posVar.getInt(index);

        if (trackSurface == -1 || lap == -1 || pos == 0) {
            continue;
        }

        cars_.emplace_back(SessionCarState{
            .index = index,
            .lap = lapVar.getInt(index),
            .lapsCompleted = lapsCompletedVar.getInt(index),
            .lapPercentComplete = lapPercentCompleteVar.getFloat(index),
            .estimatedTime = estTimeVar.getFloat(index),
            .position = {.overall = posVar.getInt(index), .clazz = clazzPosVar.getInt(index)}
        });
    }
}

const std::vector<SessionDataEvent::SessionCarState> &SessionDataEvent::cars() {
    return cars_;
}
SessionDataEvent::SessionDataEvent(SessionDataEventType type, SessionDataAccess *dataAccess) : dataAccess_(dataAccess) {
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

} // namespace IRacingTools::Shared
