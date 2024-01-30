//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <QThread>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Types.h>

namespace IRacingTools {
namespace App {
namespace Services {

using IRSessionDataCarDetail = std::tuple<int, int, std::string&>;

class IRDataEvent : public QObject {
    Q_OBJECT

    explicit IRDataEvent(QList<IRSessionDataCarDetail>&& carDetails);

    QList<IRSessionDataCarDetail> getCarDetails() const;
    
    

private:
    QList<IRSessionDataCarDetail> carDetails_{};
};


class IRDataAccess : public SDK::Utils::Singleton<IRDataAccess> {
public:
    IRDataAccess() = delete;
    IRDataAccess(const IRDataAccess&) = delete;
    IRDataAccess(IRDataAccess&&) = delete;
    
    // session status
    const SDK::VarHolder PitsOpen {"PitsOpen"}; // (bool) True if pit stop is allowed, basically true if caution lights not out
    const SDK::VarHolder RaceLaps {"RaceLaps"}; // (int) Laps completed in race
    const SDK::VarHolder SessionFlags {"SessionFlags"}; // (int) FlagType, bitfield
    const SDK::VarHolder SessionLapsRemain {"SessionLapsRemain"}; // (int) Laps left till session ends
    const SDK::VarHolder SessionLapsRemainEx {"SessionLapsRemainEx"}; // (int) New improved laps left till session ends
    const SDK::VarHolder SessionNum {"SessionNum"}; // (int) Session number
    const SDK::VarHolder SessionState {"SessionState"}; // (int) SessionState, Session state
    const SDK::VarHolder SessionTick {"SessionTick"}; // (int) Current update number
    const SDK::VarHolder SessionTime {"SessionTime"}; // (double), s, Seconds since session start
    const SDK::VarHolder SessionTimeOfDay {"SessionTimeOfDay"}; // (float) s, Time of day in seconds
    const SDK::VarHolder SessionTimeRemain {"SessionTimeRemain"}; // (double) s, Seconds left till session ends
    const SDK::VarHolder SessionUniqueID {"SessionUniqueID"}; // (int) Session ID
    
    // competitor information, array of up to 64 cars
    const SDK::VarHolder CarIdxEstTime {"CarIdxEstTime"}; // (float) s, Estimated time to reach current location on track
    const SDK::VarHolder CarIdxClassPosition {"CarIdxClassPosition"}; // (int) Cars class position in race by car index
    const SDK::VarHolder CarIdxF2Time {"CarIdxF2Time"}; // (float) s, Race time behind leader or fastest lap time otherwise
    const SDK::VarHolder CarIdxGear {"CarIdxGear"}; // (int) -1=reverse 0=neutral 1..n=current gear by car index
    const SDK::VarHolder CarIdxLap {"CarIdxLap"}; // (int) Lap count by car index
    const SDK::VarHolder CarIdxLapCompleted {"CarIdxLapCompleted"}; // (int) Laps completed by car index
    const SDK::VarHolder CarIdxLapDistPct {"CarIdxLapDistPct"}; // (float) %, Percentage distance around lap by car index
    const SDK::VarHolder CarIdxOnPitRoad {"CarIdxOnPitRoad"}; // (bool) On pit road between the cones by car index
    const SDK::VarHolder CarIdxPosition {"CarIdxPosition"}; // (int) Cars position in race by car index
    const SDK::VarHolder CarIdxRPM {"CarIdxRPM"}; // (float) revs/min, Engine rpm by car index
    const SDK::VarHolder CarIdxSteer {"CarIdxSteer"}; // (float) rad, Steering wheel angle by car index
    const SDK::VarHolder CarIdxTrackSurface {"CarIdxTrackSurface"}; // (int) TrackLocation, Track surface type by car index
    const SDK::VarHolder CarIdxTrackSurfaceMaterial {"CarIdxTrackSurfaceMaterial"};
    // (int) TrackSurface, Track surface material type by car index

    // new variables
    const SDK::VarHolder CarIdxLastLapTime {"CarIdxLastLapTime"}; // (float) s, Cars last lap time
    const SDK::VarHolder CarIdxBestLapTime {"CarIdxBestLapTime"}; // (float) s, Cars best lap time
    const SDK::VarHolder CarIdxBestLapNum {"CarIdxBestLapNum"}; // (int) Cars best lap number

    const SDK::VarHolder CarIdxP2P_Status{"CarIdxP2P_Status"}; // (bool) Push2Pass active or not
    const SDK::VarHolder CarIdxP2P_Count{"CarIdxP2P_Count"}; // (int) Push2Pass count of usage (or remaining in Race)

    const SDK::VarHolder PaceMode {"PaceMode"}; // (int) PaceMode, Are we pacing or not
    const SDK::VarHolder CarIdxPaceLine {"CarIdxPaceLine"}; // (int) What line cars are pacing in, or -1 if not pacing
    const SDK::VarHolder CarIdxPaceRow {"CarIdxPaceRow"}; // (int) What row cars are pacing in, or -1 if not pacing
    const SDK::VarHolder CarIdxPaceFlags {"CarIdxPaceFlags"}; // (int) PaceFlagType, Pacing status flags for each car

    
private:
    friend Singleton;
    
    explicit IRDataAccess(token) {
        
    }
};


/**
 * @brief IRacing Data Service
 */
class IRDataServiceThread : public QThread {
    Q_OBJECT

    explicit IRDataServiceThread(QObject * parent = nullptr);
    void run() override;


signals:
    [[maybe_unused]] void dataEventReceived(const IRDataEvent& ev);

private:
    void init();
    void process();
    void processData();
    void processLapInfo();
    bool processYAMLLiveString();

    void checkConnection();

    void cleanup();
    
    std::atomic_bool isConnected_{false};
    DWORD lastUpdatedTime_{0};
    HANDLE dataValidEvent_{nullptr};
};

} // namespace Services
} // namespace App
} // namespace IRacingTools
