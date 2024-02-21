#pragma once

#include <string>
#include <variant>

namespace IRacingTools::SDK::SessionInfo
{
    struct Driver
    {
        std::int32_t carIdx;
        std::string userName;
        std::string abbrevName;
        std::string initials;
        std::int32_t userID;
        std::int32_t teamID;
        std::string teamName;
        std::string carNumber;
        std::int32_t carNumberRaw;
        std::string carPath;
        std::int32_t carClassID;
        std::int32_t carID;
        std::int32_t carIsPaceCar;
        std::int32_t carIsAI;
        std::int32_t carIsElectric;
        std::string carScreenName;
        std::string carScreenNameShort;
        std::string carClassShortName;
        std::int32_t carClassRelSpeed;
        std::int32_t carClassLicenseLevel;
        std::string carClassMaxFuelPct;
        std::string carClassWeightPenalty;
        std::string carClassPowerAdjust;
        std::string carClassDryTireSetLimit;
        std::string carClassColor;
        float carClassEstLapTime;
        std::int32_t iRating;
        std::int32_t licLevel;
        std::int32_t licSubLevel;
        std::string licString;
        std::string licColor;
        std::int32_t isSpectator;
        std::string carDesignStr;
        std::string helmetDesignStr;
        std::string suitDesignStr;
        std::int32_t bodyType;
        std::int32_t faceType;
        std::int32_t helmetType;
        std::string carNumberDesignStr;
        std::string carSponsor1;
        std::string carSponsor2;
        std::string clubName;
        std::int32_t clubID;
        std::string divisionName;
        std::int32_t divisionID;
        std::int32_t curDriverIncidentCount;
        std::int32_t teamIncidentCount;
    };
}