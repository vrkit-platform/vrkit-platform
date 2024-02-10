#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct Frequency
    {
        std::int32_t frequencyNum;
        std::string frequencyName;
        std::int32_t priority;
        std::int32_t carIdx;
        std::int32_t entryIdx;
        std::int32_t clubID;
        std::int32_t canScan;
        std::int32_t canSquawk;
        std::int32_t muted;
        std::int32_t isMutable;
        std::int32_t isDeletable;


    };
}  // namespace IRacingTools::SDK::SessionInfo