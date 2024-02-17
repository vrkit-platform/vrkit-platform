//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QtCore>

#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>

namespace IRacingTools::App {


  //#define QIRTPROPS
  /**
   * @brief Exposes `SDK::SessionInfo::WeekendInfo` -> `Qt/QML` via props
   */
  class AppDriverInfoWeekendInfo : public QObject, public IRacingTools::SDK::SessionInfo::DriverInfo {
    Q_OBJECT
    Q_PROPERTY(QString setupName MEMBER setupName NOTIFY changed FINAL)

  public:
    QString setupName;

    explicit AppDriverInfoWeekendInfo(IRacingTools::SDK::SessionInfo::DriverInfo &driverInfo,
                                       QObject *parent = nullptr)
        : QObject(parent), setupName(QString::fromStdString(driverInfo.driverSetupName)){};



  signals:

    void changed();

  private:

  };
}// namespace IRacingTools::App