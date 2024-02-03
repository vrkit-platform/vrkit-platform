//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <QThread>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/VarHolder.h>

#include <QEventLoop>
#include <QAbstractEventDispatcher>

namespace IRacingTools {
namespace App {
namespace Services {



class IRDataAccess : public SDK::Utils::Singleton<IRDataAccess> {
public:
    IRDataAccess() = delete;
    IRDataAccess(const IRDataAccess&) = delete;
    IRDataAccess(IRDataAccess&&) = delete;

    // session status
    SDK::VarHolder PitsOpen {"PitsOpen"}; // (bool) True if pit stop is allowed, basically true if caution lights not out
    SDK::VarHolder RaceLaps {"RaceLaps"}; // (int) Laps completed in race
    SDK::VarHolder SessionFlags {"SessionFlags"}; // (int) FlagType, bitfield
    SDK::VarHolder SessionLapsRemain {"SessionLapsRemain"}; // (int) Laps left till session ends
    SDK::VarHolder SessionLapsRemainEx {"SessionLapsRemainEx"}; // (int) New improved laps left till session ends
    SDK::VarHolder SessionNum {"SessionNum"}; // (int) Session number
    SDK::VarHolder SessionState {"SessionState"}; // (int) SessionState, Session state
    SDK::VarHolder SessionTick {"SessionTick"}; // (int) Current update number
    SDK::VarHolder SessionTime {"SessionTime"}; // (double), s, Seconds since session start
    SDK::VarHolder SessionTimeOfDay {"SessionTimeOfDay"}; // (float) s, Time of day in seconds
    SDK::VarHolder SessionTimeRemain {"SessionTimeRemain"}; // (double) s, Seconds left till session ends
    SDK::VarHolder SessionUniqueID {"SessionUniqueID"}; // (int) Session ID

    // competitor information, array of up to 64 cars
    SDK::VarHolder CarIdxEstTime {"CarIdxEstTime"}; // (float) s, Estimated time to reach current location on track
    SDK::VarHolder CarIdxClassPosition {"CarIdxClassPosition"}; // (int) Cars class position in race by car index
    SDK::VarHolder CarIdxF2Time {"CarIdxF2Time"}; // (float) s, Race time behind leader or fastest lap time otherwise
    SDK::VarHolder CarIdxGear {"CarIdxGear"}; // (int) -1=reverse 0=neutral 1..n=current gear by car index
    SDK::VarHolder CarIdxLap {"CarIdxLap"}; // (int) Lap count by car index
    SDK::VarHolder CarIdxLapCompleted {"CarIdxLapCompleted"}; // (int) Laps completed by car index
    SDK::VarHolder CarIdxLapDistPct {"CarIdxLapDistPct"}; // (float) %, Percentage distance around lap by car index
    SDK::VarHolder CarIdxOnPitRoad {"CarIdxOnPitRoad"}; // (bool) On pit road between the cones by car index
    SDK::VarHolder CarIdxPosition {"CarIdxPosition"}; // (int) Cars position in race by car index
    SDK::VarHolder CarIdxRPM {"CarIdxRPM"}; // (float) revs/min, Engine rpm by car index
    SDK::VarHolder CarIdxSteer {"CarIdxSteer"}; // (float) rad, Steering wheel angle by car index
    SDK::VarHolder CarIdxTrackSurface {"CarIdxTrackSurface"}; // (int) TrackLocation, Track surface type by car index
    SDK::VarHolder CarIdxTrackSurfaceMaterial {"CarIdxTrackSurfaceMaterial"};
    // (int) TrackSurface, Track surface material type by car index

    // new variables
    SDK::VarHolder CarIdxLastLapTime {"CarIdxLastLapTime"}; // (float) s, Cars last lap time
    SDK::VarHolder CarIdxBestLapTime {"CarIdxBestLapTime"}; // (float) s, Cars best lap time
    SDK::VarHolder CarIdxBestLapNum {"CarIdxBestLapNum"}; // (int) Cars best lap number

    SDK::VarHolder CarIdxP2P_Status{"CarIdxP2P_Status"}; // (bool) Push2Pass active or not
    SDK::VarHolder CarIdxP2P_Count{"CarIdxP2P_Count"}; // (int) Push2Pass count of usage (or remaining in Race)

    SDK::VarHolder PaceMode {"PaceMode"}; // (int) PaceMode, Are we pacing or not
    SDK::VarHolder CarIdxPaceLine {"CarIdxPaceLine"}; // (int) What line cars are pacing in, or -1 if not pacing
    SDK::VarHolder CarIdxPaceRow {"CarIdxPaceRow"}; // (int) What row cars are pacing in, or -1 if not pacing
    SDK::VarHolder CarIdxPaceFlags {"CarIdxPaceFlags"}; // (int) PaceFlagType, Pacing status flags for each car


private:
    friend Singleton;

    explicit IRDataAccess(token) {

    }
};

#define IRVAR(VarName) IRDataAccess::GetInstance().VarName



class IRSessionUpdateEvent : public QObject {
    Q_OBJECT
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
    };

    explicit IRSessionUpdateEvent(QObject * parent = nullptr);

    void refresh();
    QList<SessionCarState>& getCars();
    
    

private:
    QList<SessionCarState> cars_{};
};



/**
 * @brief IRacing Data Service
 */
class IRDataServiceThread : public QThread {
    Q_OBJECT
    void run() override;

signals:
    [[maybe_unused]] void sessionUpdated(IRSessionUpdateEvent& ev);
//    void dataEventReceived();

public:
    explicit IRDataServiceThread(QObject * parent = nullptr);

private:
    void init();
    void process();
    void processData();
    void processSessionUpdate();
    bool processYAMLLiveString();

    void checkConnection();

    void cleanup();

    QAbstractEventDispatcher* dispatcher_{nullptr};

    std::atomic_bool isConnected_{false};
    DWORD lastUpdatedTime_{0};
//    HANDLE dataValidEvent_{nullptr};
};

} // namespace Services
} // namespace App
} // namespace IRacingTools
