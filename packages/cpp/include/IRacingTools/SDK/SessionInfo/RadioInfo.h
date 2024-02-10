#pragma once

#include "Radio.h"
#include <string>
#include <vector>

namespace IRacingTools::SDK::SessionInfo
{
    struct RadioInfo
    {
        std::int32_t selectedRadioNum;
        std::vector<Radio> radios;


    };
}  // namespace IRacingTools::SDK::SessionInfo