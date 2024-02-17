//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QMutex>
#include <QtCore>
#include <QtQml>

#include <IRacingTools/Shared/SessionDataProvider.h>

#include "AppWeekendInfoModels.h"
#include "AppDriverInfoModels.h"

namespace IRacingTools::App {
  using namespace IRacingTools::Shared;


  /**
   * @brief Exposes `SDK::SessionInfo::SessionInfoMessage` -> `Qt/QML` via props
   */
  class AppSessionInfoMessage : public QObject {
  Q_OBJECT

    Q_PROPERTY(AppSessionInfoWeekendInfo *weekendInfo MEMBER weekendInfo_ NOTIFY changed FINAL)
  public:
    explicit AppSessionInfoMessage(
        IRacingTools::SDK::SessionInfo::SessionInfoMessage *info,
        QObject *parent = nullptr) :
        QObject(parent), weekendInfo_(new AppSessionInfoWeekendInfo(info->weekendInfo, this)) {
    };

  signals:

    void changed();

  private:
    AppSessionInfoWeekendInfo *weekendInfo_;
  };
}