#include <IRacingTools/Shared/Utils/TypeIdHelpers.h>

namespace IRacingTools::Shared::Utils {
  std::string PrettyTypeId::toString() const {
    return std::format("ns={},nsCount={},templateString={},basename={},name={},fullname={}", nsString, ns.size(),
                       templateString, basename, name, fullname);
  }

  std::optional<PrettyTypeId> GetPrettyTypeId(const std::string &src, const std::vector<std::string> &omitPrefixes, bool omitTemplate) {
    static const std::regex typePartsExp(
        R"(^(class|struct)?\s?(([A-Za-z0-9_:]+)::)?([A-Za-z0-9_]+)((\<[A-Za-z0-9_:\<\>,\s]+\>|)$))");

    std::smatch typePartsMatch;

    if (std::regex_search(src, typePartsMatch, typePartsExp)) {

      // CREATE THE RETURN OBJECT
      PrettyTypeId typeId{.templateString = typePartsMatch[6], .basename = typePartsMatch[4]};

      // GET NS AS STRING
      std::string nsStr = typePartsMatch[3];

      // OMIT PREFIXES REQUESTED
      for (auto &prefix: omitPrefixes) {
        if (!nsStr.starts_with(prefix))
          continue;

        nsStr = nsStr.replace(0, prefix.length(), "");
      }

      // ASSIGN NAMESPACE STRING
      typeId.nsString = nsStr;

      // CREATE NAME & FULLNAME
      typeId.name = typeId.basename;
      if (!omitTemplate)
        typeId.name+= typeId.templateString;

      typeId.fullname = nsStr + "::" + typeId.name;

      // TOKENIZE THE NAMESPACE
      std::regex nsSeperatorExp("::");
      std::copy(std::sregex_token_iterator(nsStr.begin(), nsStr.end(), nsSeperatorExp, -1),
                std::sregex_token_iterator(), std::back_inserter(typeId.ns));

      return typeId;
    } else {
      return std::nullopt;
    }
  }
} // namespace IRacingTools::Shared::Utils