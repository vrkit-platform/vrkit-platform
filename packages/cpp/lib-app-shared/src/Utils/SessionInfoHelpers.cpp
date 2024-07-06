#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>

namespace IRacingTools::Shared::Utils {
  const std::expected<std::string_view, SDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage& sessionInfo) {
    auto& winfo = sessionInfo.weekendInfo;
    auto& trackId = winfo.trackID;
    auto& trackName = winfo.trackName;
    auto& trackConfigName = winfo.trackConfigName;
    if (!trackId || trackName.empty() || trackConfigName.empty()) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "To determine the track id, the `sessionInfo.weekendInfo` must have the following valid, non-empty, members "
      "`trackID`, `trackName`, `trackConfigName`"));
    }

    auto trackLayoutId = std::format("{}::{}::{}",trackId, trackName, trackConfigName);

  }
}