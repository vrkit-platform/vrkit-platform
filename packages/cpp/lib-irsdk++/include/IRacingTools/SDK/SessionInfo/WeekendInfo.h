#pragma once

#include "TelemetryOptions.h"
#include "WeekendOptions.h"
#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct WeekendInfo
    {
        std::string trackName;
        std::int32_t trackID;
        std::string trackLength;
        std::string trackLengthOfficial;
        std::string trackDisplayName;
        std::string trackDisplayShortName;
        std::string trackConfigName;
        std::string trackCity;
        std::string trackCountry;
        std::string trackAltitude;
        std::string trackLatitude;
        std::string trackLongitude;
        std::string trackNorthOffset;
        std::int32_t trackNumTurns;
        std::string trackPitSpeedLimit;
        std::string trackType;
        std::string trackDirection;
        std::string trackWeatherType;
        std::string trackSkies;
        std::string trackSurfaceTemp;
        std::string trackAirTemp;
        std::string trackAirPressure;
        std::string trackWindVel;
        std::string trackWindDir;
        std::string trackRelativeHumidity;
        std::string trackFogLevel;
        std::string trackPrecipitation;
        std::int32_t trackCleanup;
        std::int32_t trackDynamicTrack;
        std::string trackVersion;
        std::int32_t seriesID;
        std::int32_t seasonID;
        std::int32_t sessionID;
        std::int32_t subSessionID;
        std::int32_t leagueID;
        std::int32_t official;
        std::int32_t raceWeek;
        std::string eventType;
        std::string category;
        std::string simMode;
        std::int32_t teamRacing;
        std::int32_t minDrivers;
        std::int32_t maxDrivers;
        std::string dCRuleSet;
        std::int32_t qualifierMustStartRace;
        std::int32_t numCarClasses;
        std::int32_t numCarTypes;
        std::int32_t heatRacing;
        std::string buildType;
        std::string buildTarget;
        std::string buildVersion;
        WeekendOptions weekendOptions;
        TelemetryOptions telemetryOptions;


    };
}