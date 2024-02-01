//
// Created by jglanz on 1/28/2024.
//

#include <QDebug>

#include "IRDataService.h"

namespace IRacingTools {
namespace App {
namespace Services {

using namespace IRacingTools::SDK;

IRSessionUpdateEvent::IRSessionUpdateEvent(QObject* parent) : QObject(parent) {
    refresh();
}

void IRSessionUpdateEvent::refresh() {
    static auto& lapVar = IRVAR(CarIdxLap);
    static auto& lapsCompletedVar = IRVAR(CarIdxLapCompleted);
    static auto& posVar = IRVAR(CarIdxPosition);
    static auto& clazzPosVar = IRVAR(CarIdxClassPosition);
    static auto& estTimeVar = IRVAR(CarIdxEstTime);
    static auto& lapPercentCompleteVar = IRVAR(CarIdxLapDistPct);
    cars_.clear();

    qDebug() << "Lap var count = " << lapVar.getCount();

    for (int index = 0;index < Resources::MaxCars;index++) {
        auto trackSurface = IRVAR(CarIdxTrackSurface).getInt(index);

        auto lap = lapVar.getInt(index);
        auto pos = posVar.getInt(index);

        if (trackSurface == -1 || lap == -1 || pos == 0) {
            continue;
        }

        cars_.emplaceBack(SessionCarState{
            .index = index,
            .lap = lapVar.getInt(index),
            .lapsCompleted = lapsCompletedVar.getInt(index),
            .lapPercentComplete = lapPercentCompleteVar.getFloat(index),
            .estimatedTime = estTimeVar.getFloat(index),
            .position = {
                .overall = posVar.getInt(index),
                .clazz = clazzPosVar.getInt(index)
            }
        });
    }

    qDebug() << "Session car count = " << cars_.size();

}

QList<IRSessionUpdateEvent::SessionCarState>& IRSessionUpdateEvent::getCars() {
    return cars_;
}

void IRDataServiceThread::run() {
    init();
    while (!isInterruptionRequested()) {
        process();
    }
    cleanup();
}
void IRDataServiceThread::init() {
    // bump priority up so we get time from the sim
    SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

    // ask for 1ms timer so sleeps are more precise
    timeBeginPeriod(1);

    dispatcher_ = QAbstractEventDispatcher::instance(this);
    // startup event broadcaster
    //dataValidEvent_ = CreateEvent(nullptr, true, false, Resources::DataValidEventName);
}

void IRDataServiceThread::cleanup() {
//    if (dataValidEvent_) {
//        //make sure event not left triggered (probably redundant)
//        ResetEvent(dataValidEvent_);
//        CloseHandle(dataValidEvent_);
//        dataValidEvent_ = nullptr;
//    }
}
void IRDataServiceThread::processData() {
    auto &client = LiveClient::GetInstance();
    bool wasUpdated = false;

    // and grab the data
    processSessionUpdate();

    if (processYAMLLiveString())
        wasUpdated = true;

    // only process session string if it changed
    if (client.wasSessionStrUpdated()) {
        qDebug() << "SessionStr updated: " << client.getSessionCt();
        //        processYAMLSessionString(LiveClient::GetInstance().getSessionStr());
        wasUpdated = true;
    }

//    if (wasUpdated) {
//
//    }

    // Process signals/events
    dispatcher_->processEvents(QEventLoop::AllEvents);
    // notify clients
//    if (wasUpdated && dataValidEvent_) {
//        qDebug() << "Updating client";
//        PulseEvent(dataValidEvent_);
//    }

    // #ifdef DUMP_TO_DISPLAY
    // update the display as well
    //        updateDisplay();
    // #endif
}
void IRDataServiceThread::process() {
    // wait up to 16 ms for start of session or new data
    if (LiveClient::GetInstance().waitForData(16)) {
        processData();
    }
    // else we did not grab data, do nothing

    // pump our connection status
    checkConnection();
}
void IRDataServiceThread::processSessionUpdate() {

    IRSessionUpdateEvent event{};
    qDebug() << "Emitting session update";
    emit sessionUpdated(event);
}
void IRDataServiceThread::checkConnection() {
    auto isConnected = LiveClient::GetInstance().isConnected();
    if (isConnected_ == isConnected)
        return;

    if (isConnected) {
        qDebug() << "Connected to iRacing";
        //            resetState(true);
    } else
        qDebug() << "Disconnected to iRacing";

    //****Note, put your connection handling here
    isConnected_ = isConnected;
}
bool IRDataServiceThread::processYAMLLiveString() {
    bool wasUpdated = false;

    //****Note, your code goes here
    // can write to disk, parse, etc

    // output file once every 1 seconds
    const auto minTime = static_cast<DWORD>(1000);
    const auto curTime = timeGetTime(); // millisecond resolution
    if (abs(static_cast<long long>(curTime - lastUpdatedTime_)) > minTime) {
        lastUpdatedTime_ = curTime;
        wasUpdated = true;
        qDebug() << "Updated session str at: " << curTime;
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
IRDataServiceThread::IRDataServiceThread(QObject *parent) : QThread(parent) {}
} // namespace Services
} // namespace App
} // namespace IRacingTools