#include <VRKit/Shared/Utils/ModelHelpers.h>
#include <VRKit/Shared/Logging/LoggingManager.h>

namespace VRKit::Shared::Utils {
  using namespace VRKit::Shared::Logging;

  namespace {
    auto L = LoggingManager::Get().getCategory(__FILE__);
  }


  Models::Session::SessionDataVarType ToSessionDataVarType(IRacingSDK::VarDataType sdkVarDataType) {
    return sdkVarDataType == IRacingSDK::VarDataType::Char ?
           Models::Session::SessionDataVarType::SESSION_DATA_VAR_TYPE_CHAR :
           sdkVarDataType == IRacingSDK::VarDataType::Bool ?
           Models::Session::SessionDataVarType::SESSION_DATA_VAR_TYPE_BOOL :
           sdkVarDataType == IRacingSDK::VarDataType::Bitmask ?
           Models::Session::SessionDataVarType::SESSION_DATA_VAR_TYPE_BITMASK :
           sdkVarDataType == IRacingSDK::VarDataType::Int32 ?
           Models::Session::SessionDataVarType::SESSION_DATA_VAR_TYPE_INT32 :
           sdkVarDataType == IRacingSDK::VarDataType::Float ?
           Models::Session::SessionDataVarType::SESSION_DATA_VAR_TYPE_FLOAT :
           Models::Session::SessionDataVarType::SESSION_DATA_VAR_TYPE_DOUBLE;
  }
}