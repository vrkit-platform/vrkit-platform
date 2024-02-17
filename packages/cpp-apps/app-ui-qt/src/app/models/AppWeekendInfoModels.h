//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QMutex>
#include <QtCore>
#include <QtQml>

#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::App {
  using namespace IRacingTools::Shared;

  //#define QIRTPROPS
  /**
   * @brief Exposes `SDK::SessionInfo::WeekendInfo` -> `Qt/QML` via props
   */
  class AppSessionInfoWeekendInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString trackName MEMBER trackName_ NOTIFY changed FINAL)

  public:
    explicit AppSessionInfoWeekendInfo(IRacingTools::SDK::SessionInfo::WeekendInfo &weekendInfo,
                                       QObject *parent = nullptr)
        : QObject(parent), trackName_(QString::fromStdString(weekendInfo.trackName)){};

  signals:

    void changed();

  private:
    QString trackName_;
  };
}// namespace IRacingTools::App