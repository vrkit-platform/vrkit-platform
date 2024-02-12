//
// Created by jglanz on 2/9/2024.
//

#include "AppSessionState.h"

namespace IRacingTools::App {
  using namespace IRacingTools::SDK;

  /**
   * @inherit
   */
  AppSessionState::AppSessionState(QObject *parent) : QObject(parent) {
  }

  void AppSessionState::setInfo(const std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> & info) {
//    if (!info_) {
      info_ = QSharedPointer<AppSessionInfoMessage>::create(info.get());
      emit infoChanged();
//    }
  }

  AppSessionInfoMessage* AppSessionState::info() {
    return info_.get();
  }

  /**
   * @inherit
   */
  void AppSessionState::setTime(int time) {
    if (time != time_) {
      time_ = time;
      emit timeChanged();
    }
  }

  /**
   * @inherit
   */
//  int AppSessionState::time() const {
//    return time_;
//  }
}// namespace IRacingTools::App