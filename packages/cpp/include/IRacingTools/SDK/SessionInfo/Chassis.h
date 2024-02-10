#pragma once

#include "Front.h"
#include "LeftFront.h"
#include "Rear.h"
#include <string>
namespace IRacingTools::SDK::SessionInfo
{
    struct Chassis
    {
        Front front;
        LeftFront leftFront;
        LeftFront leftRear;
        LeftFront rightFront;
        LeftFront rightRear;
        Rear rear;


    };
}  // namespace IRacingTools::SDK::SessionInfo