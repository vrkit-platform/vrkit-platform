//
// Created by jglanz on 1/28/2024.
//

#pragma once
#include <string>


namespace IRacingTools::Shared::IPC {
  std::string CreateNamedPipePath(const std::string& pipeName);

  std::uint32_t NextNamedPipeConnectionId();
}
