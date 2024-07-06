//
// Created by jglanz on 1/29/2024.
//

#pragma once

#include "Types.h"
namespace IRacingTools::SDK::Data {

struct SessionCar {
    int index;
    // for convenience, the index into the array is the carIdx
    float estTime;
    // s, Estimated time to reach current location on track
    int classPosition;
    // Cars class position in race by car index
    float f2Time;
    // s, Race time behind leader or fastest lap time otherwise
    int gear;
    // -1=reverse 0=neutral 1-n=current gear by car index
    int lap;
    // Lap count by car index
    int lapCompleted;
    // Laps completed by car index
    float lapDistPct;
    // %, Percentage distance around lap by car index
    int onPitRoad;
    // On pit road between the cones by car index
    int position;
    // Cars position in race by car index
    float rPM;
    // revs/min, Engine rpm by car index
    float steer;
    // rad, Steering wheel angle by car index
    int trackSurface;
    // TrackLocation, Track surface type by car index
    int trackSurfaceMaterial;
};


struct SessionWeather {
    float airDensity;
    float airPressure;
    float airTemp;
    float fogLevel;
    float relativeHumidity;
    // Skies (0=clear/1=p cloudy/2=m cloudy/3=overcast)
    int skies;
    float trackTempCrew;

    // Weather type (0=constant 1=dynamic)
    int weatherType;
    float windDirection;
    float windVelocity;
};

struct Session {
    bool pitsOpen;
    // True if pit stop is allowed, basically true if caution lights not out
    int raceLaps;
    int flags;
    int lapsRemain;
    // Laps left till session ends
    int lapsRemainEx;
    // New improved laps left till session ends
    int num;
    int state;
    // AppSessionState, Session state
    int tick;
    double time;
    // s, Seconds since session start
    float timeOfDay;
    // s, Time of day in seconds
    double timeRemain;
    // s, Seconds left till session ends
    int uniqueID;

    bool paceModeValid;
    PaceMode paceMode;

    int carCount;
    std::vector<SessionCar> cars;
};


} // namespace IRacingTools::SDK::Data