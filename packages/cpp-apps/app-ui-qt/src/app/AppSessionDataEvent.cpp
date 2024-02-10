//
// Created by jglanz on 2/9/2024.
//
//
// Created by jglanz on 2/7/2024.
//

#include "AppSessionDataEvent.h"
#include "AppState.h"

namespace IRacingTools::App {
  using namespace IRacingTools::SDK;

  /**
   * @inherit
   */
  AppSessionDataEvent::AppSessionDataEvent(std::shared_ptr<Shared::SessionDataUpdatedEvent> dataEvent, QObject *parent)
      : QObject(parent), time_(dataEvent->sessionTimeMillis()), cars_(dataEvent->cars()) {
  }

  /**
   * @inherit
   */
  int AppSessionDataEvent::time() {
    return time_;
  }

  /**
   * @inherit
   */
  std::vector<Shared::SessionDataUpdatedEvent::SessionCarState> &AppSessionDataEvent::cars() {
    return cars_;
  }
}