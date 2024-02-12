//
// Created by jglanz on 2/9/2024.
//

#pragma once
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <QMutex>
#include <QtCore>
#include <QtQml>

namespace IRacingTools::App {
  using namespace IRacingTools::SDK;

  /**
   * @brief Session data model event
   */
  class AppSessionDataEvent : public QObject {
    Q_OBJECT

  public:
    explicit AppSessionDataEvent(std::shared_ptr<IRacingTools::Shared::SessionDataUpdatedEvent> dataEvent,
                                 QObject *parent = nullptr);

    std::vector<IRacingTools::Shared::SessionDataUpdatedEvent::SessionCarState> &cars();

    std::weak_ptr<SessionInfo::SessionInfoMessage> sessionInfo();

    int time();

  private:
    int time_;
    std::weak_ptr<SessionInfo::SessionInfoMessage> sessionInfo_;
    std::vector<IRacingTools::Shared::SessionDataUpdatedEvent::SessionCarState> cars_;
  };

}