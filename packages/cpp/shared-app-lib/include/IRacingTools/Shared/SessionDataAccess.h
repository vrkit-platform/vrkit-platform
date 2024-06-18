//
// Created by jglanz on 2/14/2024.
//

#pragma once
#include <memory>

#include <IRacingTools/SDK/Client.h>
#include <IRacingTools/SDK/VarHolder.h>

namespace IRacingTools::Shared {
    class SessionDataAccess : public SDK::ClientProvider {
        std::shared_ptr<SDK::ClientProvider> clientProvider_;

        public:
            SessionDataAccess() = delete;

            explicit SessionDataAccess(std::shared_ptr<SDK::ClientProvider> clientProvider) : clientProvider_(std::move(clientProvider)) {};

            SessionDataAccess(const SessionDataAccess&) = delete;

            SessionDataAccess(SessionDataAccess&&) = delete;

        virtual std::shared_ptr<SDK::ClientProvider> getClientProvider();
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

            //    std::shared_ptr<SessionDataUpdatedEvent> createDataEvent();
    };
}
