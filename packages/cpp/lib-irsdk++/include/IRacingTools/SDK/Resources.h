#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"

namespace IRacingTools::SDK::Resources {
constexpr auto DataValidEventName     = _T("Local\\IRSDKDataValidEvent");
constexpr auto MemMapFilename         = _T("Local\\IRSDKMemMapFileName");
constexpr auto BroadcastMessageName   = _T("IRSDK_BROADCASTMSG");

constexpr int MaxBufferCount = 4;
constexpr int MaxStringLength = 32;

// descriptions can be longer than max_string!
constexpr int MaxDescriptionLength = 64;

constexpr int MaxCars = 64;

// define markers for unlimited session lap and time
constexpr int UnlimitedLaps = 32767;
constexpr float UnlimitedTime = 604800.0f;

// latest version of our telemetry headers
using VersionType = int;
constexpr VersionType Version = 2;


}
