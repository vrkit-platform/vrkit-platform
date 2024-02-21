#pragma once

#include "BrakeSpec.h"
#include "Engine.h"
#include "Fuel.h"
#include "GearRatio.h"
namespace IRacingTools::SDK::SessionInfo
{
    struct BrakesDriveUnit
    {
        BrakeSpec brakeSpec;
        Fuel fuel;
        Engine engine;
        GearRatio gearRatios;


    };
}