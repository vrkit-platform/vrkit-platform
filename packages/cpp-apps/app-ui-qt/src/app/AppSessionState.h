//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QMutex>
#include <QtCore>
#include <QtQml>

#include <IRacingTools/Shared/SessionDataProvider.h>

#include "models/AppSessionInfoModels.h"

#include "AppSessionConfig.h"

namespace IRacingTools::App {
  using namespace IRacingTools::Shared;

  /**
   * @brief App Session State, holds references to `SessionInfoMessage` model
   */
  class AppSessionState : public QObject {
    Q_OBJECT
    Q_PROPERTY(AppSessionInfoMessage *info READ info NOTIFY infoChanged FINAL)
    Q_PROPERTY(int time MEMBER time_ NOTIFY timeChanged FINAL)
  public:
    explicit AppSessionState(QObject *parent);

    /**
     * @brief Set the current info message
     *
     * @param info
     */
    void setInfo(const std::shared_ptr<IRacingTools::SDK::SessionInfo::SessionInfoMessage> &info);

    /**
     * @brief Get current info message
     *
     * @return
     */
    AppSessionInfoMessage *info();

    /**
     * @brief Current session time
     *
     * @param time
     */
    void setTime(int time);

  signals:
    void timeChanged();
    void infoChanged();

  private:
    int time_{-1};
    QSharedPointer<AppSessionInfoMessage> info_{nullptr};
  };
}// namespace IRacingTools::App
