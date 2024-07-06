#pragma once


#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct ResultsPosition
    {
        std::int32_t position;
        std::int32_t classPosition;
        std::int32_t carIdx;
        std::int32_t lap;
        float time;
        std::int32_t fastestLap;
        float fastestTime;
        float lastTime;
        std::int32_t lapsLed;
        std::int32_t lapsComplete;
        std::int32_t jokerLapsComplete;
        float lapsDriven;
        std::int32_t incidents;
        std::int32_t reasonOutId;
        std::string reasonOutStr;


    };
}