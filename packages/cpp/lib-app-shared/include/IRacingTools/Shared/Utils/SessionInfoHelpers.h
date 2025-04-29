#pragma once

#include <expected>

#include <IRacingSDK/SessionInfo/SessionInfoMessage.h>
#include <IRacingSDK/ErrorTypes.h>
#include <IRacingSDK/Types.h>

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/SessionDataTypes.h>

namespace IRacingTools::Shared::Utils {
  using IRacingSDK::SessionInfo::SessionInfoMessage;

  std::expected<std::string, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage& sessionInfoMessage);
  std::expected<std::string, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutId(const std::shared_ptr<SessionInfoMessage>& sessionInfoMessage);
  std::expected<std::string, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage* sessionInfoMessage);

  std::expected<std::shared_ptr<Models::TrackLayoutMetadata>, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutMetadata(const SessionInfoMessage& sessionInfoMessage);
  std::expected<std::shared_ptr<Models::TrackLayoutMetadata>, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutMetadata(const std::shared_ptr<SessionInfoMessage>& sessionInfoMessage);
  std::expected<std::shared_ptr<Models::TrackLayoutMetadata>, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutMetadata(const SessionInfoMessage* sessionInfoMessage);
  std::expected<Models::TrackLayoutMetadata *, IRacingSDK::GeneralError> GetSessionInfoTrackLayoutMetadata(Models::TrackLayoutMetadata * trackLayoutMetadata, const SessionInfoMessage* sessionInfoMessage);



}// namespace IRacingTools::Shared::Services