#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct SessionResult {
        std::int32_t position;
        std::int32_t classPosition;
        std::int32_t carIdx;
        std::int32_t fastestLap;
        float fastestTime;
    };
}  // namespace IRacingTools::SDK::SessionInfo