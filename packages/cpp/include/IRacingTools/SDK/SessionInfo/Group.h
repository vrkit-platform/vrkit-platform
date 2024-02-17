#pragma once

#include "Camera.h"
#include <string>
#include <vector>

namespace IRacingTools::SDK::SessionInfo
{
    struct Group
    {
        std::int32_t groupNum;
        std::string groupName;
        std::vector<Camera> cameras;
        bool isScenic;


    };
}