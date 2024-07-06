#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>
#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Utils {
  using SDK::SessionInfo::SessionInfoMessage;
  const std::expected<std::string_view, SDK::GeneralError> GetSessionInfoTrackLayoutId(const SessionInfoMessage& sessionInfo);
  
}// namespace IRacingTools::Shared::Services