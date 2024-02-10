#pragma once

#include <variant>


namespace IRacingTools::SDK::SessionInfo
{
    using TrackFogLevel = int32_t;
    using CarClassMaxFuelPct = int32_t;

    using CarClassPowerAdjust = int32_t;
    using Car = std::string;
    using CarClassWeightPenalty = int32_t
        ;
    using CarNumberDesignStr = std::string;
    using CarPath = std::string;
    using ReasonOutStr = std::string;
    using SessionLaps = std::variant<std::int32_t,std::string>;
} // core