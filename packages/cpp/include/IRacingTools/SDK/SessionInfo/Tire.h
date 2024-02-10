#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct Tire
    {
        std::string startingPressure;
        std::string lastHotPressure;
        std::string lastTempsOMI;
        std::string treadRemaining;
        std::string lastTempsIMO;


    };
}  // namespace IRacingTools::SDK::SessionInfo