#pragma once

#include "Frequency.h"
#include <string>
#include <vector>

namespace IRacingTools::SDK::SessionInfo
{
    struct Radio
    {
        std::int32_t radioNum;
        std::int32_t hopCount;
        std::int32_t numFrequencies;
        std::int32_t tunedToFrequencyNum;
        std::int32_t scanningIsOn;
        std::vector<Frequency> frequencies;


    };
}