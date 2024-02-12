#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct Tire
    {
        float startingPressure;
        float lastHotPressure;
        float lastTempsOMI;
        float treadRemaining;
        float lastTempsIMO;


    };
}  // namespace IRacingTools::SDK::SessionInfo