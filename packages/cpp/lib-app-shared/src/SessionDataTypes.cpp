#include <VRKit/Shared/SessionDataTypes.h>


namespace VRKit::Shared {
  std::array<std::string_view, 3> GetSessionSubTypes() {
    static std::array<std::string_view, 3> names{
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

    return names;
  }
}
