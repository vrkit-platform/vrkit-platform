#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>
#include <optional>
#include <regex>

#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <boost/type_index.hpp>

namespace VRKit::Shared::Utils {
  using namespace IRacingSDK::Utils;


  template<typename T>
  struct PrettyType {
      std::string name() {
         auto& info = boost::typeindex::type_id_with_cvr<T>().type_info();
         auto id = boost::typeindex::type_id_with_cvr<T>();
         std::string prettyName = id.pretty_name();
         std::string name = id.name();
         return name;
       };
     };


  constexpr auto OmitTemplateDefault = true;

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
                                              const std::vector<std::string> &omitPrefixes = {},
                                              bool omitTemplate = OmitTemplateDefault);

  template<typename T>
  std::optional<PrettyTypeId> GetPrettyTypeId(const std::vector<std::string> &omitPrefixes,
                                              bool omitTemplate = false) {
    return GetPrettyTypeId(PrettyType<T>().name(), omitPrefixes, OmitTemplateDefault);
  }

  template<typename T>
  std::optional<PrettyTypeId> GetPrettyTypeId(bool omitTemplate = false) {
    return GetPrettyTypeId<T>(std::vector<std::string>{}, OmitTemplateDefault);
  }
} // namespace VRKit::Shared::Utils