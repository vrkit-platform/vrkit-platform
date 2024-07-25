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

  std::expected<std::string, SDK::GeneralError>
  GetSessionInfoTrackLayoutId(const SessionInfoMessage *sessionInfoMessage) {
    auto res = GetSessionInfoTrackLayoutMetadata(sessionInfoMessage);
    if (!res) {
      return std::unexpected(res.error());
    }

    return res.value()->id();
  }
  std::expected<std::shared_ptr<Models::TrackLayoutMetadata>, SDK::GeneralError>
  GetSessionInfoTrackLayoutMetadata(
      const SessionInfoMessage &sessionInfoMessage) {
    return GetSessionInfoTrackLayoutMetadata(&sessionInfoMessage);
  }

  std::expected<std::shared_ptr<Models::TrackLayoutMetadata>, SDK::GeneralError>
  GetSessionInfoTrackLayoutMetadata(
      const std::shared_ptr<SessionInfoMessage> &sessionInfoMessage) {
    return GetSessionInfoTrackLayoutMetadata(sessionInfoMessage.get());
  }

  std::expected<std::shared_ptr<Models::TrackLayoutMetadata>, SDK::GeneralError>
  GetSessionInfoTrackLayoutMetadata(
      const SessionInfoMessage *sessionInfoMessage) {
    if (!sessionInfoMessage) {
      return std::unexpected(SDK::GeneralError(
          SDK::ErrorCode::General, "NULL SessionInfoMessage"));
    }
    auto &winfo = sessionInfoMessage->weekendInfo;
    auto &trackId = winfo.trackID;
    auto &trackName = winfo.trackName;
    auto &trackVersion = winfo.trackVersion;
    std::string trackLayoutName = winfo.trackConfigName;
    if (trackLayoutName == "null")
      trackLayoutName = "NO_CONFIG_NAME";

    if (!trackId || trackName.empty() || trackLayoutName.empty()) {
      return std::unexpected(SDK::GeneralError(
          SDK::ErrorCode::General,
          "To determine the track id, the `sessionInfo.weekendInfo` must have "
          "the following valid, non-empty, members "
          "`trackID`, `trackName`,  `trackConfigName`"));
    }

    auto trackLayoutId =
        fmt::format("{}::{}::{}", trackId, trackName, trackLayoutName);
    L->info("Computed track layout id from session info >> {}", trackLayoutId);

    auto tlm = std::make_shared<Models::TrackLayoutMetadata>();
    auto tm = tlm->mutable_track_metadata();

    tlm->set_id(trackLayoutId);
    tlm->set_name(trackLayoutName);
    tm->set_id(trackId);
    tm->set_name(trackName);
    tm->set_version(trackVersion);

    return tlm;
  }
} // namespace IRacingTools::Shared::Utils