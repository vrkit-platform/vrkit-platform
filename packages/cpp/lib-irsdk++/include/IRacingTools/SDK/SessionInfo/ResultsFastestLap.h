#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct ResultsFastestLap
    {
        std::int32_t carIdx;
        std::int32_t fastestLap;
        float fastestTime;


    };
}