#pragma once

#include <string>

namespace IRacingTools::SDK::SessionInfo
{
    struct ChassisCorner {
        std::string cornerWeight;
        std::string rideHeight;
        std::string shockDefl;
        std::string springPerchOffset;
        std::string springRate;
        std::string lsCompDamping;
        std::string hsCompDamping;
        std::string hsRbdDamping;
        std::string camber;
        std::string springDefl;
        std::string toeIn;


    };
}