#pragma once

#include "CameraInfo.h"
#include "CarSetup.h"
#include "DriverInfo.h"
#include "QualifyResultsInfo.h"
#include "RadioInfo.h"
#include "SessionInfo.h"
#include "SplitTimeInfo.h"
#include "WeekendInfo.h"
namespace IRacingTools::SDK::SessionInfo
{
    struct SessionInfoMessage
    {
        WeekendInfo weekendInfo;
        SessionInfo sessionInfo;
        QualifyResultsInfo qualifyResultsInfo;
        CameraInfo cameraInfo;
        RadioInfo radioInfo;
        DriverInfo driverInfo;
        SplitTimeInfo splitTimeInfo;
        CarSetup carSetup;


    };
}