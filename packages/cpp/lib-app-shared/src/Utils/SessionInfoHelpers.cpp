#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

namespace IRacingTools::Shared::Utils {
  using namespace IRacingTools::Shared::Logging;
  
  namespace {
    auto L = LoggingManager::Get().getCategory(__FILE__);
  }
  
  std::expected<std::string, SDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage& sessionInfoMessage) {
    return GetSessionInfoTrackLayoutId(&sessionInfoMessage);
  }

  std::expected<std::string, SDK::GeneralError> GetSessionInfoTrackLayoutId(const std::shared_ptr<SessionInfoMessage>& sessionInfoMessage) {
    return GetSessionInfoTrackLayoutId(sessionInfoMessage.get());
  }

  std::expected<std::string, SDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage* sessionInfoMessage) {
    if (!sessionInfoMessage) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "NULL SessionInfoMessage"));
    }
    auto& winfo = sessionInfoMessage->weekendInfo;
    auto& trackId = winfo.trackID;
    auto& trackName = winfo.trackName;
    std::string trackConfigName = winfo.trackConfigName;
    if (trackConfigName == "null")
      trackConfigName = "NO_CONFIG_NAME";

    if (!trackId || trackName.empty() || trackConfigName.empty()) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "To determine the track id, the `sessionInfo.weekendInfo` must have the following valid, non-empty, members "
      "`trackID`, `trackName`,  `trackConfigName`"));
    }

    auto trackLayoutId = fmt::format("{}::{}::{}",trackId, trackName, trackConfigName);
    L->info("Computed track layout id from session info >> {}", trackLayoutId);
    return trackLayoutId;
  }
}