#pragma once

#include "ChassisCorner.h"
#include "Front.h"
#include "Rear.h"
#include <string>
namespace IRacingTools::SDK::SessionInfo
{
    struct Chassis
    {
        Front front;
        ChassisCorner leftFront;
        ChassisCorner leftRear;
        ChassisCorner rightFront;
        ChassisCorner rightRear;
        Rear rear;


    };
}