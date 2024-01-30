//
// Created by jglanz on 1/28/2024.
//

#include <QDebug>

#include "IRDataService.h"

namespace IRacingTools {
namespace App {
namespace Services {

using namespace IRacingTools::SDK;

IRDataEvent::IRDataEvent(QList<IRSessionDataCarDetail> &&carDetails) : carDetails_(carDetails) {}
QList<IRSessionDataCarDetail> IRDataEvent::getCarDetails() const {
    return carDetails_;
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

    // startup event broadcaster
    dataValidEvent_ = CreateEvent(nullptr, true, false, Resources::DataValidEventName);
}

void IRDataServiceThread::cleanup() {
    if (dataValidEvent_) {
        //make sure event not left triggered (probably redundant)
        ResetEvent(dataValidEvent_);
        CloseHandle(dataValidEvent_);
        dataValidEvent_ = nullptr;
    }
}
void IRDataServiceThread::processData() {
    auto &client = LiveClient::instance();
    bool wasUpdated = false;

    // and grab the data
    processLapInfo();
    if (processYAMLLiveString())
        wasUpdated = true;

    // only process session string if it changed
    if (client.wasSessionStrUpdated()) {
        qDebug() << "SessionStr updated: " << client.getSessionCt();
        //        processYAMLSessionString(LiveClient::instance().getSessionStr());
        wasUpdated = true;
    }

    // notify clients
    if (wasUpdated && dataValidEvent_) {
        qDebug() << "Updating client";
        PulseEvent(dataValidEvent_);
    }

    // #ifdef DUMP_TO_DISPLAY
    // update the display as well
    //        updateDisplay();
    // #endif
}
void IRDataServiceThread::process() {
    // wait up to 16 ms for start of session or new data
    if (LiveClient::instance().waitForData(16)) {
        processData();
    }
    // else we did not grab data, do nothing

    // pump our connection status
    checkConnection();
}
void IRDataServiceThread::processLapInfo() {}
void IRDataServiceThread::checkConnection() {
    auto isConnected = LiveClient::instance().isConnected();
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