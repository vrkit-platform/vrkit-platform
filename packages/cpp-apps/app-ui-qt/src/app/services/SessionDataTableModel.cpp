//
// Created by jglanz on 1/28/2024.
//

#include <QDebug>
#include <QSize>

#include "SessionDataTableModel.h"

namespace IRacingTools {
namespace App {
namespace Services {

using namespace IRacingTools::SDK;

SessionDataModelEvent::SessionDataModelEvent(std::shared_ptr<Shared::SessionDataEvent> dataEvent, QObject *parent) :
    QObject(parent), cars_(dataEvent->cars()) {}

std::vector<Shared::SessionDataEvent::SessionCarState> &SessionDataModelEvent::cars() {
    return cars_;
}

void SessionDataTableModel::cleanup() {
    resetDataProvider();
}

//void SessionDataProviderModel::init() {
//    // bump priority up so we get time from the sim
//    SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);
//
//    // ask for 1ms timer so sleeps are more precise
//    timeBeginPeriod(1);
//
//    dispatcher_ = QAbstractEventDispatcher::instance(this);
//    // startup event broadcaster
//    //dataValidEvent_ = CreateEvent(nullptr, true, false, Resources::DataValidEventName);
//}

//void SessionDataProviderModel::processData() {
//    auto &client = LiveClient::GetInstance();
//    bool wasUpdated = false;
//
//    // and grab the data
//    processSessionUpdate();
//
//    if (processYAMLLiveString())
//        wasUpdated = true;
//
//    // only process session string if it changed
//    if (client.wasSessionStrUpdated()) {
////        qDebug() << "SessionStr updated: " << client.getSessionUpdateCount().value_or(0);
//        //        processYAMLSessionString(LiveClient::GetInstance().getSessionStr());
//        wasUpdated = true;
//    }
//
////    if (wasUpdated) {
////
////    }
//
//    // Process signals/events
//    dispatcher_->processEvents(QEventLoop::AllEvents);
//    // notify clients
////    if (wasUpdated && dataValidEvent_) {
////        qDebug() << "Updating client";
////        PulseEvent(dataValidEvent_);
////    }
//
//    // #ifdef DUMP_TO_DISPLAY
//    // update the display as well
//    //        updateDisplay();
//    // #endif
//}
//void SessionDataProviderModel::process() {
//    // wait up to 16 ms for start of session or new data
//    if (LiveClient::GetInstance().waitForData(16)) {
//        processData();
//    }
//    // else we did not grab data, do nothing
//
//    // pump our connection status
//    checkConnection();
//}
//void SessionDataProviderModel::processSessionUpdate() {
//
////    IRSessionUpdateEvent event{};
////    qDebug() << "Emitting session update";
////    emit sessionUpdated(event);
//}
//void SessionDataProviderModel::checkConnection() {
//    auto isConnected = LiveClient::GetInstance().isConnected();
//    if (isConnected_ == isConnected)
//        return;
//
//    if (isConnected) {
//        qDebug() << "Connected to iRacing";
//        //            resetState(true);
//    } else
//        qDebug() << "Disconnected to iRacing";
//
//    //****Note, put your connection handling here
//    isConnected_ = isConnected;
//}
//bool SessionDataProviderModel::processYAMLLiveString() {
//    bool wasUpdated = false;
//
//    //****Note, your code goes here
//    // can write to disk, parse, etc
//
//    // output file once every 1 seconds
//    const auto minTime = static_cast<DWORD>(1000);
//    const auto curTime = timeGetTime(); // millisecond resolution
//    if (abs(static_cast<long long>(curTime - lastUpdatedTime_)) > minTime) {
//        lastUpdatedTime_ = curTime;
//        wasUpdated = true;
//        qDebug() << "Updated session str at: " << curTime;
//        //        const char* yamlStr = generateLiveYAMLString();
//        //        // validate string
//        //        if (yamlStr && yamlStr[0])
//        //        {
//        //            FILE* f = fopen("liveStr.txt", "w");
//        //            if (f)
//        //            {
//        //                fputs(yamlStr, f);
//        //                fclose(f);
//        //                f = nullptr;
//        //                wasUpdated = true;
//        //            }
//        //        }
//    }
//
//    return wasUpdated;
//}
SessionDataTableModel::SessionDataTableModel(QObject *parent) : QAbstractTableModel(parent) {
    connect(this, &SessionDataTableModel::sessionDataChanged, this, &SessionDataTableModel::onSessionDataChanged);
}
SessionDataTableModel::SessionDataTableModel(std::shared_ptr<Shared::SessionDataProvider> dataProvider, QObject *parent) :
    SessionDataTableModel(parent) {
    setDataProvider(dataProvider);
}

void SessionDataTableModel::resetDataProvider() {
    std::scoped_lock lock(dataProviderMutex_);
    if (dataProvider_) {
        dataProvider_->stop();
        dataProvider_.reset();
    }
}

void SessionDataTableModel::setDataProvider(std::shared_ptr<Shared::SessionDataProvider> dataProvider) {
    // TODO: Revisit with recursive mutex
    resetDataProvider();

    std::scoped_lock lock(dataProviderMutex_);
    dataProvider_ = dataProvider;
    if (dataProvider_) {
        dataProvider_->subscribe([&](std::shared_ptr<Shared::SessionDataEvent> srcEvent) {
            auto event = QSharedPointer<SessionDataModelEvent>::create(srcEvent);
            emit sessionDataChanged(event);
        });
        dataProvider_->start();
    }
}
void SessionDataTableModel::onSessionDataChanged(QSharedPointer<SessionDataModelEvent> event) {
    std::scoped_lock lock(dataMutex_);
    beginResetModel();
    cars_ = event->cars();
    endResetModel();
}
int SessionDataTableModel::rowCount(const QModelIndex &parent) const {
    return cars_.size();
}
int SessionDataTableModel::columnCount(const QModelIndex &parent) const {
    return 7;
}
QVariant SessionDataTableModel::data(const QModelIndex &index, int role) const {
    auto &car = cars_[index.row()];
    auto data = car.toTuple();
    auto memberIdx = index.column();
    QVariant value(
        memberIdx == 0       ? std::get<0>(data)
            : memberIdx == 1 ? std::get<1>(data)
            : memberIdx == 2 ? std::get<2>(data)
            : memberIdx == 3 ? std::get<3>(data)
            : memberIdx == 4 ? std::get<4>(data)
            : memberIdx == 5 ? std::get<5>(data)
            : memberIdx == 6 ? std::get<6>(data)
                             : 0
    );
    //    if (memberIdx < 3) {
    //        value = memberIdx == 0 ? car.index :
    //        memberIdx
    //    }
    return value;
}
QVariant SessionDataTableModel::headerData(int, Qt::Orientation, int role) const {
    if (role == Qt::SizeHintRole)
        return QSize(1, 1);
    return QVariant();
}

} // namespace Services
} // namespace App
} // namespace IRacingTools