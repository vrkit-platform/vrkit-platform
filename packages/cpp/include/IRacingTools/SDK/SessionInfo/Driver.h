#pragma once

#include "TypesCore.h"
#include <string>
#include <variant>

namespace IRacingTools::SDK::SessionInfo
{
    struct Driver
    {
        std::int32_t carIdx;
        std::string userName;
        std::string AbbrevName;
        std::string Initials;
        std::int32_t userID;
        std::int32_t teamID;
        std::string teamName;
        std::string carNumber;
        std::int32_t carNumberRaw;
        CarPath carPath;
        std::int32_t carClassID;
        std::int32_t carID;
        std::int32_t carIsPaceCar;
        std::int32_t carIsAI;
        std::int32_t carIsElectric;
        Car carScreenName;
        Car carScreenNameShort;
        Car CarClassShortName;
        std::int32_t carClassRelSpeed;
        std::int32_t carClassLicenseLevel;
        CarClassMaxFuelPct carClassMaxFuelPct;
        CarClassWeightPenalty carClassWeightPenalty;
        CarClassPowerAdjust carClassPowerAdjust;
        TrackFogLevel carClassDryTireSetLimit;
        std::int32_t carClassColor;
        float carClassEstLapTime;
        std::int32_t iRating;
        std::int32_t licLevel;
        std::int32_t licSubLevel;
        std::string licString;
        std::int32_t licColor;
        std::int32_t isSpectator;
        std::string carDesignStr;
        std::string helmetDesignStr;
        std::string suitDesignStr;
        std::int32_t bodyType;
        std::int32_t faceType;
        std::int32_t helmetType;
        CarNumberDesignStr carNumberDesignStr;
        std::int32_t CarSponsor_1;
        std::int32_t CarSponsor_2;
        std::string clubName;
        std::int32_t clubID;
        std::string divisionName;
        std::int32_t divisionID;
        std::int32_t curDriverIncidentCount;
        std::int32_t teamIncidentCount;


    };
}  // namespace IRacingTools::SDK::SessionInfo