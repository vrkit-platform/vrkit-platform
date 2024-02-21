#pragma once

#include "AeroSettings.h"
#include "Tire.h"
namespace IRacingTools::SDK::SessionInfo
{
    struct TiresAero
    {
        Tire leftFrontTire;
        Tire leftRearTire;
        Tire rightFrontTire;
        Tire rightRearTire;
        AeroSettings aeroSettings;
    };
}