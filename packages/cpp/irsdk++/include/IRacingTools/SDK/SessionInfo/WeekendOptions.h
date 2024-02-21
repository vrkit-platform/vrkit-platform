#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct WeekendOptions
    {
        std::int32_t numStarters;
        std::string startingGrid;
        std::string qualifyScoring;
        std::string courseCautions;
        std::int32_t standingStart;
        std::int32_t shortParadeLap;
        std::string restarts;
        std::string weatherType;
        std::string skies;
        std::string windDirection;
        std::string windSpeed;
        std::string weatherTemp;
        std::string relativeHumidity;
        std::string fogLevel;
        std::string timeOfDay;
        std::string date;
        std::int32_t earthRotationSpeedupFactor;
        std::int32_t unofficial;
        std::string commercialMode;
        std::string nightMode;
        std::int32_t isFixedSetup;
        std::string strictLapsChecking;
        std::int32_t hasOpenRegistration;
        std::int32_t hardcoreLevel;
        std::int32_t numJokerLaps;
        std::int32_t incidentLimit;
        std::int32_t fastRepairsLimit;
        std::int32_t greenWhiteCheckeredLimit;


    };
}