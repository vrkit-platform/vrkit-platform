#pragma once

#include "BrakeSpec.h"
#include "Engine.h"
#include "Fuel.h"
#include "GearRatios.h"
namespace IRacingTools::SDK::SessionInfo
{
    struct BrakesDriveUnit
    {
        BrakeSpec brakeSpec;
        Fuel fuel;
        Engine engine;
        GearRatios gearRatios;


    };
}  // namespace IRacingTools::SDK::SessionInfo