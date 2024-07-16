#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>
#include <optional>
#include <regex>

#include <IRacingTools/SDK/ErrorTypes.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>

namespace IRacingTools::Shared::Utils {
  using namespace SDK::Utils;
  struct PrettyTypeId {
    /**
     * @brief namespace breadcrumbs
     */
    std::vector<std::string> ns{};

    /**
     * @brief namespace breadcrumbs
     */
    std::string nsString{};

    /**
     * @brief template portion of declaration
     */
    std::string templateString{};

    /**
     * @brief Base name without template or ns
     */
    std::string basename{};

    /**
     * @brief name with template args
     */
    std::string name{};

    /**
     * @brief full name includes the stringified ns
     */
    std::string fullname{};

    std::string toString() const;
  };

  std::optional<PrettyTypeId> GetPrettyTypeId(const std::string &src,
                                              const std::vector<std::string> &omitPrefixes = {});

  template<typename T>
  std::optional<PrettyTypeId> GetPrettyTypeId(const std::vector<std::string> &omitPrefixes) {
    return GetPrettyTypeId(PrettyType<T>().name(), omitPrefixes);
  }

  template<typename T>
  std::optional<PrettyTypeId> GetPrettyTypeId() {
    return GetPrettyTypeId<T>(std::vector<std::string>{});
  }
} // namespace IRacingTools::Shared::Utils