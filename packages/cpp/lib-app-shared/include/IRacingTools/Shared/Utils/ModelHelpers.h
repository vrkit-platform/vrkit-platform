#pragma once

#include <IRacingSDK/Types.h>

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/SessionDataTypes.h>

namespace IRacingTools::Shared::Utils {

  Models::Session::SessionDataVarType ToSessionDataVarType(IRacingSDK::VarDataType sdkVarDataType);

}// namespace IRacingTools::Shared::Services