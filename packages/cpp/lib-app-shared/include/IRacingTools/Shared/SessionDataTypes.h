#pragma once

#include <regex>
#include <IRacingTools/Models/Session/SessionState.pb.h>
#include <IRacingSDK/Utils/EnumHelpers.h>

namespace IRacingTools::Shared {
  std::array<std::string_view, 3> GetSessionSubTypes();
}