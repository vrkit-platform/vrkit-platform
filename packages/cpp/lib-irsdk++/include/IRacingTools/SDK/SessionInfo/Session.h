#pragma once

#include "ResultsFastestLap.h"
#include "ResultsPosition.h"

#include <string>
#include <variant>
#include <vector>

namespace IRacingTools::SDK::SessionInfo
{
    struct Session
    {

        std::int32_t sessionNum;
        std::string sessionLaps;
        std::string sessionTime;
        std::int32_t sessionNumLapsToAvg;
        std::string sessionType;
        std::string sessionTrackRubberState;
        std::string sessionName;
//        null SessionSubType;
        std::int32_t sessionSkipped;
        std::int32_t sessionRunGroupsUsed;
        std::int32_t sessionEnforceTireCompoundChange;
        std::vector<ResultsPosition> resultsPositions;
        std::vector<ResultsFastestLap> resultsFastestLap;
        std::int32_t resultsAverageLapTime;
        std::int32_t resultsNumCautionFlags;
        std::int32_t resultsNumCautionLaps;
        std::int32_t resultsNumLeadChanges;
        std::int32_t resultsLapsComplete;
        std::int32_t resultsOfficial;


    };
}