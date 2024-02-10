//
// Created by jglanz on 1/28/2024.
//

#include <QDebug>
#include <QSize>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>

#include "../AppState.h"
#include "AppSessionDataEvent.h"
#include "SessionDataTableModel.h"

namespace IRacingTools::App::Services {
using namespace IRacingTools::SDK;

SessionDataTableModel::SessionDataTableModel(QObject *parent) : QAbstractTableModel(parent) {
    auto manager = AppSessionManager::GetPtr().get();
    connect(manager, &AppSessionManager::dataEvent, this, &SessionDataTableModel::onDataEvent);
}

SessionDataTableModel::~SessionDataTableModel() {}

/**
     * @brief Slot for session data event
     *
     * @param event
     */
void SessionDataTableModel::onDataEvent(QSharedPointer<AppSessionDataEvent> event) {
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

} // namespace IRacingTools::App::Services
