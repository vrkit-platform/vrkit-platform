#pragma once

#include <IRacingSDK/Types.h>

#include <VRKit/Shared/SharedAppLibPCH.h>
#include <VRKit/Shared/Games/IRacing/SessionDataTypes.h>

namespace VRKit::Shared::Utils {

  Models::Session::SessionDataVarType ToSessionDataVarType(IRacingSDK::VarDataType sdkVarDataType);

}// namespace VRKit::Shared::Services