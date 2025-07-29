#pragma once

#include <regex>
#include <VRKit/Models/Session/SessionState.pb.h>
#include <IRacingSDK/Utils/EnumHelpers.h>

namespace VRKit::Shared::Games::IRacing {
  constexpr std::array<std::string_view, 3> GetSessionSubTypes() {
    return std::array<std::string_view, 3>{
        {
          std::regex_replace(
            IRacingSDK::Utils::EnumName(Models::Session::SessionSubType::SESSION_SUB_TYPE_PRACTICE),
            std::regex{"^SESSION_SUB_TYPE_"},
            ""
          ),
          std::regex_replace(
            IRacingSDK::Utils::EnumName(Models::Session::SessionSubType::SESSION_SUB_TYPE_QUALIFY),
            std::regex{"^SESSION_SUB_TYPE_"},
            ""
          ),
          std::regex_replace(
            IRacingSDK::Utils::EnumName(Models::Session::SessionSubType::SESSION_SUB_TYPE_RACE),
            std::regex{"^SESSION_SUB_TYPE_"},
            ""
          )
        }
    };

  }
}