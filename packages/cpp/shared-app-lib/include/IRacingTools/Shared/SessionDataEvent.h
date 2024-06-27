//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <memory>
#include <thread>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/EventEmitter.h>
#include <IRacingTools/SDK/VarHolder.h>


namespace IRacingTools::Shared {

  class SessionDataEvent;
  class SessionDataUpdatedDataEvent;
  class SessionDataAccess;
  
  enum class SessionDataEventType { UpdatedData, UpdatedInfo, Session, Available };

  class SessionDataEvent {

  public:
    SessionDataEvent() = delete;
    virtual ~SessionDataEvent() = default;
    explicit SessionDataEvent(SessionDataEventType type);

    SessionDataEventType type();


  protected:
    SessionDataEventType type_;
  };

  

  class SessionDataUpdatedInfoEvent : public SessionDataEvent {
  public:
    SessionDataUpdatedInfoEvent() = delete;
    explicit SessionDataUpdatedInfoEvent(std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> newSessionInfo);
    virtual ~SessionDataUpdatedInfoEvent() = default;

    std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo();
  private:
    std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo_{};    
  };
  
  /**
   * @brief Flattened tuple per car
   *
   * index                int
   * lap                  int
   * lapsCompleted        int
   * lapPercentComplete   float
   * estimatedTime        float
   * position.overall     int
   * position.clazz       int
   * driver               std::optional<SDK::SessionInfo::Driver>
   */
  using SessionCarStateRecord =
      std::tuple<int, int, int, float, float, int, int, std::optional<SDK::SessionInfo::Driver> &>;

  /**
   * @brief Data update event triggered on every new
   *  data frame/tick received from IRacing
   */
  class SessionDataUpdatedDataEvent : public SessionDataEvent {
  public:
    struct SessionCarState {
      int index{};

      int lap{};
      int lapsCompleted{};
      float lapPercentComplete{};

      float estimatedTime{};

      struct {
        int overall{};
        int clazz{};
      } position{};

      std::optional<SDK::SessionInfo::Driver> driver;

      SessionCarStateRecord toTuple();
    };

    SessionDataUpdatedDataEvent() = delete;
    explicit SessionDataUpdatedDataEvent(SessionDataEventType type, SessionDataAccess *dataAccess);
    virtual ~SessionDataUpdatedDataEvent() = default;

    void refresh();

    int sessionTimeMillis();

    const std::vector<SessionCarState> &cars();

    std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo();


  private:
    SessionDataAccess *dataAccess_;
    std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo_{};
    std::vector<SessionCarState> cars_{};
    int sessionTimeMillis_{-1};
  };
}