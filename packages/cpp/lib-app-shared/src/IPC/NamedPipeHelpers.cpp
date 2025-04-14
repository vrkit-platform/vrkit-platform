#include <IRacingTools/Shared/IPC/NamedPipeHelpers.h>

#include <format>

namespace IRacingTools::Shared::IPC {
  std::string CreateNamedPipePath(const std::string& pipeName) {
    return std::format(R"(\\.\pipe\{})", pipeName);
  };

  std::uint32_t NextNamedPipeConnectionId() {
    static std::atomic_uint32_t ConnectionIdCounter_{0};

    return ConnectionIdCounter_.fetch_add(1);
  };
}
