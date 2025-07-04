#pragma once

#include <regex>
#include <VRKit/Models/Session/SessionState.pb.h>
#include <IRacingSDK/Utils/EnumHelpers.h>

namespace VRKit::Shared {
  std::array<std::string_view, 3> GetSessionSubTypes();
}