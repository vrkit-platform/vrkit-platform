#pragma once

#include "Driver.h"
#include <string>
#include <vector>

namespace IRacingTools::SDK::SessionInfo
{
    struct DriverInfo
    {
        std::int32_t driverCarIdx;
        std::int32_t driverUserID;
        std::int32_t paceCarIdx;
        float driverHeadPosX;
        float driverHeadPosY;
        float driverHeadPosZ;
        std::int32_t driverCarIsElectric;
        std::int32_t driverCarIdleRPM;
        std::int32_t driverCarRedLine;
        std::int32_t driverCarEngCylinderCount;
        float driverCarFuelKgPerLtr;
        std::int32_t driverCarFuelMaxLtr;
        float driverCarMaxFuelPct;
        std::int32_t driverCarGearNumForward;
        std::int32_t driverCarGearNeutral;
        std::int32_t driverCarGearReverse;
        std::int32_t driverCarSLFirstRPM;
        std::int32_t driverCarSLShiftRPM;
        std::int32_t driverCarSLLastRPM;
        std::int32_t driverCarSLBlinkRPM;
        std::string driverCarVersion;
        float driverPitTrkPct;
        float driverCarEstLapTime;
        std::string driverSetupName;
        std::int32_t driverSetupIsModified;
        std::string driverSetupLoadTypeName;
        std::int32_t driverSetupPassedTech;
        std::int32_t driverIncidentCount;
        std::vector<Driver> drivers;


    };
}