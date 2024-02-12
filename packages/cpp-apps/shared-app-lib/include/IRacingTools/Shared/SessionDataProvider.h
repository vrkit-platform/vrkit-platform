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

#include "Chrono.h"

namespace IRacingTools::Shared {

  class SessionDataEvent;
  class SessionDataUpdatedEvent;

  class SessionDataAccess : public SDK::ClientProvider {
  private:
    std::weak_ptr<SDK::Client> client_;

  public:
    SessionDataAccess() = delete;

    explicit SessionDataAccess(std::weak_ptr<SDK::Client> client);

    SessionDataAccess(const SessionDataAccess &) = delete;

    SessionDataAccess(SessionDataAccess &&) = delete;

    virtual std::shared_ptr<SDK::Client> getClient() override;

#define DeclareVarHolder(Name) SDK::VarHolder Name {#Name, this}
    DeclareVarHolder(PitsOpen); // (bool) True if pit stop is allowed, basically true if caution lights not out
    DeclareVarHolder(RaceLaps); // (int) Laps completed in race
    DeclareVarHolder(SessionFlags); // (int) FlagType, bitfield
    DeclareVarHolder(SessionLapsRemain); // (int) Laps left till session ends
    DeclareVarHolder(SessionLapsRemainEx); // (int) New improved laps left till session ends
    DeclareVarHolder(SessionNum); // (int) Session number
    DeclareVarHolder(SessionState); // (int) AppSessionState, Session state
    DeclareVarHolder(SessionTick); // (int) Current update number
    DeclareVarHolder(SessionTime); // (double), s, Seconds since session start
    DeclareVarHolder(SessionTimeOfDay); // (float) s, Time of day in seconds
    DeclareVarHolder(SessionTimeRemain); // (double) s, Seconds left till session ends
    DeclareVarHolder(SessionUniqueID); // (int) Session ID

    // competitor information, array of up to 64 cars
    DeclareVarHolder(CarIdxEstTime); // (float) s, Estimated time to reach current location on track
    DeclareVarHolder(CarIdxClassPosition); // (int) Cars class position in race by car index
    DeclareVarHolder(CarIdxF2Time); // (float) s, Race time behind leader or fastest lap time otherwise
    DeclareVarHolder(CarIdxGear); // (int) -1=reverse 0=neutral 1..n=current gear by car index
    DeclareVarHolder(CarIdxLap); // (int) Lap count by car index
    DeclareVarHolder(CarIdxLapCompleted); // (int) Laps completed by car index
    DeclareVarHolder(CarIdxLapDistPct); // (float) %, Percentage distance around lap by car index
    DeclareVarHolder(CarIdxOnPitRoad); // (bool) On pit road between the cones by car index
    DeclareVarHolder(CarIdxPosition); // (int) Cars position in race by car index
    DeclareVarHolder(CarIdxRPM); // (float) revs/min, Engine rpm by car index
    DeclareVarHolder(CarIdxSteer); // (float) rad, Steering wheel angle by car index
    DeclareVarHolder(CarIdxTrackSurface); // (int) TrackLocation, Track surface type by car index
    DeclareVarHolder(CarIdxTrackSurfaceMaterial);
    // (int) TrackSurface, Track surface material type by car index

    // new variables
    DeclareVarHolder(CarIdxLastLapTime); // (float) s, Cars last lap time
    DeclareVarHolder(CarIdxBestLapTime); // (float) s, Cars best lap time
    DeclareVarHolder(CarIdxBestLapNum); // (int) Cars best lap number

    DeclareVarHolder(CarIdxP2P_Status); // (bool) Push2Pass active or not
    DeclareVarHolder(CarIdxP2P_Count); // (int) Push2Pass count of usage (or remaining in Race)

    DeclareVarHolder(PaceMode); // (int) PaceMode, Are we pacing or not
    DeclareVarHolder(CarIdxPaceLine); // (int) What line cars are pacing in, or -1 if not pacing
    DeclareVarHolder(CarIdxPaceRow); // (int) What row cars are pacing in, or -1 if not pacing
    DeclareVarHolder(CarIdxPaceFlags); // (int) PaceFlagType, Pacing status flags for each car

#undef DeclareVarHolder

    std::shared_ptr<SessionDataUpdatedEvent> createDataEvent();
  };

  enum class SessionDataEventType {
    Updated, Session, Available
  };

  class SessionDataEvent {

  public:
    SessionDataEvent() = delete;
    virtual ~SessionDataEvent() = default;
    explicit SessionDataEvent(SessionDataEventType type);

    SessionDataEventType type();


  protected:
    SessionDataEventType type_;
  };

  class SessionDataUpdatedEvent: public SessionDataEvent {
  public:
    struct SessionCarState {
      int index;
      int lap;
      int lapsCompleted;

      float lapPercentComplete;

      float estimatedTime;

      struct {
        int overall;
        int clazz;
      } position;

      std::tuple<int, int, int, float, float, int, int> toTuple() const {
        return {index, lap, lapsCompleted, lapPercentComplete, estimatedTime, position.overall, position.clazz};
      }
    };

    SessionDataUpdatedEvent() = delete;
    explicit SessionDataUpdatedEvent(SessionDataEventType type, SessionDataAccess *dataAccess);
    virtual ~SessionDataUpdatedEvent() = default;

    void refresh();

    int sessionTimeMillis();

    const std::vector<SessionCarState> &cars();

    std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo();
//    const std::string& sessionInfoYaml() {
//      return sessionInfoYaml_;
//    }


  private:
//    std::string sessionInfoYaml_{};
    SessionDataAccess *dataAccess_;
    std::weak_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo_{};
    std::vector<SessionCarState> cars_{};
    int sessionTimeMillis_{-1};
  };


  /**
   * @brief IRacing Data Service
   */
  class SessionDataProvider : public SDK::Utils::EventEmitter<std::shared_ptr<SessionDataEvent>> {

  public:
    using Ptr = std::shared_ptr<SessionDataProvider>;

    virtual ~SessionDataProvider() = default;

    virtual bool isAvailable() = 0;

    virtual bool start() = 0;

    virtual bool isRunning() = 0;

    virtual void stop() = 0;

    //    HANDLE dataValidEvent_{nullptr};
  };


  class LiveSessionDataProvider : public SessionDataProvider {

  public:
    LiveSessionDataProvider();

    virtual ~LiveSessionDataProvider() override;

    bool isAvailable() override;
    bool start() override;

    bool isRunning() override;

    void stop() override;

  protected:
    void runnable();

  private:
    void init();

    void process();

    void processData();

    void processDataUpdate();

    bool processYAMLLiveString();

    void checkConnection();

    SessionDataAccess dataAccess_;
    std::unique_ptr<std::thread> thread_{nullptr};
    std::mutex threadMutex_{};

    std::atomic_bool running_{false};
    std::atomic_bool isConnected_{false};
    DWORD lastUpdatedTime_{0};
    //    HANDLE dataValidEvent_{nullptr};
  };


  class DiskSessionDataProvider : public SessionDataProvider {

  public:
    DiskSessionDataProvider() = delete;

    DiskSessionDataProvider(const std::string &clientId, const std::filesystem::path &file);

    virtual ~DiskSessionDataProvider() override;

    bool isAvailable() override;

    bool start() override;

    bool isRunning() override;

    void stop() override;

  protected:
    void runnable();

  private:
    void init();

    void process();

    void processData();

    void processDataUpdate();

    bool processYAMLLiveString();

    void checkConnection();

    std::string clientId_;
    std::filesystem::path file_;

    std::shared_ptr<SDK::DiskClient> diskClient_;

    std::unique_ptr<SessionDataAccess> dataAccess_;
    std::unique_ptr<std::thread> thread_{nullptr};
    std::mutex threadMutex_{};
    std::mutex diskClientMutex_{};

    std::atomic_bool running_{false};
    std::atomic_bool isAvailable_{false};
    DWORD lastUpdatedTime_{0};
    //    HANDLE dataValidEvent_{nullptr};
  };

} // namespace Services


