#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>
#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Utils {
  using SDK::SessionInfo::SessionInfoMessage;
  
  std::expected<std::string, SDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage& sessionInfoMessage);
  std::expected<std::string, SDK::GeneralError> GetSessionInfoTrackLayoutId(const std::shared_ptr<SessionInfoMessage>& sessionInfoMessage);
  std::expected<std::string, SDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage* sessionInfoMessage);
  
}// namespace IRacingTools::Shared::Services