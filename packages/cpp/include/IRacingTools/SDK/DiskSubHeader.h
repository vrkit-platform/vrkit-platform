#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"
#include "Types.h"


namespace IRacingTools::SDK {


// sub header used when writing telemetry to disk
struct DiskSubHeader {
    time_t sessionStartDate;
    double sessionStartTime;
    double sessionEndTime;
    int sessionLapCount;
    int sessionRecordCount;
};

}
