//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>
#include <iostream>
#include <utility>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/SessionDataAccess.h>
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/SessionDataEvent.h>

namespace IRacingTools::Shared {
  using namespace std::chrono_literals;
  using namespace IRacingTools::SDK;

  namespace {
    int SessionTimeToMillis(double sessionTime) {
      return std::floor(sessionTime * 1000.0);
    }
  }// namespace

  SessionDataEvent::SessionDataEvent(SessionDataEventType type) : type_(type) {
  }


  SessionDataEventType SessionDataEvent::type() {
    return type_;
  }

  SessionDataUpdatedDataEvent::SessionDataUpdatedDataEvent(SessionDataEventType type, SessionDataAccess *dataAccess)
      : SessionDataEvent(type), dataAccess_(dataAccess) {
    refresh();
  }

  SessionCarStateRecord SessionDataUpdatedDataEvent::SessionCarState::toTuple() {
    return {index, lap, lapsCompleted, lapPercentComplete, estimatedTime, position.overall, position.clazz, driver};
  }

  std::shared_ptr<SDK::ClientProvider> SessionDataAccess::getClientProvider() {
    return clientProvider_;
  }

  std::shared_ptr<Client> SessionDataAccess::getClient() {
    return clientProvider_->getClient();
  }

#define IRVAR(Name) dataAccess_->Name

  void SessionDataUpdatedDataEvent::refresh() {
    auto &sessionTimeVar = IRVAR(SessionTime);
    auto &lapVar = IRVAR(CarIdxLap);
    auto &lapsCompletedVar = IRVAR(CarIdxLapCompleted);
    auto &posVar = IRVAR(CarIdxPosition);
    auto &clazzPosVar = IRVAR(CarIdxClassPosition);
    auto &estTimeVar = IRVAR(CarIdxEstTime);
    auto &lapPercentCompleteVar = IRVAR(CarIdxLapDistPct);

    std::shared_ptr<SessionInfo::SessionInfoMessage> sessionInfo{nullptr};
    if (auto client = dataAccess_->getClient()) {
      sessionInfo_ = client->getSessionInfo();
      sessionInfo = sessionInfo_.lock();
    }

    auto drivers = sessionInfo ? sessionInfo->driverInfo.drivers : std::vector<SDK::SessionInfo::Driver>{};
    cars_.clear();

    sessionTimeMillis_ = SessionTimeToMillis(sessionTimeVar.getDouble());

    for (int index = 0; index < Resources::MaxCars; index++) {
      auto trackSurface = IRVAR(CarIdxTrackSurface).getInt(index);

      std::optional<SDK::SessionInfo::Driver> driver =
          drivers.size() > index ? std::make_optional(drivers[index]) : std::nullopt;

      auto lap = lapVar.getInt(index);
      auto pos = posVar.getInt(index);

      if (trackSurface == -1 || lap == -1 || pos == 0) {
        continue;
      }

      cars_.emplace_back(
          SessionCarState{.index = index,
                          .lap = lapVar.getInt(index),
                          .lapsCompleted = lapsCompletedVar.getInt(index),
                          .lapPercentComplete = lapPercentCompleteVar.getFloat(index),
                          .estimatedTime = estTimeVar.getFloat(index),
                          .position = {.overall = posVar.getInt(index), .clazz = clazzPosVar.getInt(index)},
                          .driver = std::move(driver)});
    }
  }

  const std::vector<SessionDataUpdatedDataEvent::SessionCarState> &SessionDataUpdatedDataEvent::cars() {
    return cars_;
  }

  int SessionDataUpdatedDataEvent::sessionTimeMillis() {
    return sessionTimeMillis_;
  }

  std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> SessionDataUpdatedDataEvent::sessionInfo() {
    return sessionInfo_;
  }

  SessionDataUpdatedInfoEvent::SessionDataUpdatedInfoEvent(
      std::weak_ptr<SessionInfo::SessionInfoMessage> newSessionInfo)
      : SessionDataEvent(SessionDataEventType::UpdatedInfo), sessionInfo_(newSessionInfo) {
  }

  std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> SessionDataUpdatedInfoEvent::sessionInfo() {
    return sessionInfo_;
  }
}// namespace IRacingTools::Shared
