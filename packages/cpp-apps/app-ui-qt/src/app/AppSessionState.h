//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QMutex>
#include <QtCore>
#include <QtQml>

#include <IRacingTools/Shared/SessionDataProvider.h>

#include "AppSessionConfig.h"

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

  /**
   * @brief Exposes `SDK::SessionInfo::SessionInfoMessage` -> `Qt/QML` via props
   */
  class AppSessionInfoMessage : public QObject {
    Q_OBJECT
    Q_PROPERTY(AppSessionInfoWeekendInfo *weekendInfo MEMBER weekendInfo_ NOTIFY changed FINAL)
  public:
    explicit AppSessionInfoMessage(IRacingTools::SDK::SessionInfo::SessionInfoMessage *info, QObject *parent = nullptr)
        : QObject(parent), weekendInfo_(new AppSessionInfoWeekendInfo(info->weekendInfo, this)){};

  signals:
    void changed();

  private:
    AppSessionInfoWeekendInfo *weekendInfo_;
  };

  class AppSessionState : public QObject {
    Q_OBJECT
    Q_PROPERTY(AppSessionInfoMessage *info READ info NOTIFY infoChanged FINAL)
    Q_PROPERTY(int time MEMBER time_ NOTIFY timeChanged FINAL)
  public:
    explicit AppSessionState(QObject *parent);

    void setInfo(const std::shared_ptr<IRacingTools::SDK::SessionInfo::SessionInfoMessage> &info);
    AppSessionInfoMessage *info();

    //    int time() const;
    void setTime(int time);

  signals:
    void timeChanged();
    void infoChanged();

  private:
    int time_{-1};
    QSharedPointer<AppSessionInfoMessage> info_{nullptr};
  };
}// namespace IRacingTools::App
