//
// Created by jglanz on 1/28/2024.
//

#include <QDebug>
#include <QSize>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>

#include "../AppState.h"
#include "AppSessionDataEvent.h"
#include "SessionDataTableModel.h"

namespace IRacingTools::Services {
  using namespace IRacingTools::SDK;

  /**
   * @brief Create new table model
   *
   * @param parent
   */
  SessionDataTableModel::SessionDataTableModel(QObject *parent) : QAbstractTableModel(parent) {
    auto manager = AppSessionManager::GetPtr().get();
    connect(manager, &AppSessionManager::dataEvent, this, &SessionDataTableModel::onDataEvent);
  }

  /**
   * @brief Destructor
   */
  SessionDataTableModel::~SessionDataTableModel() = default;

  /**
     * @brief Slot for session data event
     *
     * @param event
     */
  void SessionDataTableModel::onDataEvent(QSharedPointer<AppSessionDataEvent> event) {
    beginResetModel();
    cars_ = event->cars();
    std::sort(cars_.begin(),cars_.end(), [] (auto& c1, auto& c2) {
      return c1.position.overall < c2.position.overall;
    });
    endResetModel();
  }

  int SessionDataTableModel::rowCount(const QModelIndex &parent) const {
    return cars_.size();
  }

  int SessionDataTableModel::columnCount(const QModelIndex &parent) const {
    return 5;
  }

  QVariant SessionDataTableModel::data(const QModelIndex &index, int role) const {
    auto &car = cars_[index.row()];
    //    auto data = car.toTuple();
    auto memberIdx = index.column();
    QVariant value(memberIdx == 0   ? QString::number(car.position.overall)
                   : memberIdx == 1 ? (car.driver.has_value() ? QString::fromStdString(car.driver.value().userName)
                                                              : QString("Unknown"))
                   : memberIdx == 2 ? QString::number(car.lap)
                   : memberIdx == 3 ? QString("%1%").arg(std::floor(car.lapPercentComplete * 100.0), 2, '0')
                   : memberIdx == 4 ? QString::number((double) car.estimatedTime, 'g', 3)
                                    //            : memberIdx == 5 ? std::get<5>(data)
                                    //            : memberIdx == 6 ? std::get<6>(data)
                                    //            : memberIdx == 7 ? std::get<7>(data)
                                    : 0);
    //    if (memberIdx < 3) {
    //        value = memberIdx == 0 ? car.index :
    //        memberIdx
    //    }
    return value;
  }

  QVariant SessionDataTableModel::headerData(int section, Qt::Orientation, int role) const {
    if (role == Qt::SizeHintRole)
      return QSize(1, 1);
    return QVariant(section == 0   ? "Position"
                    : section == 1 ? "Driver"
                    : section == 2 ? "Lap"
                    : section == 3 ? "Lap Percent"
                    : section == 4 ? "Est Lap Time"
                                   : "Unknown");
  }

}// namespace IRacingTools::Services
