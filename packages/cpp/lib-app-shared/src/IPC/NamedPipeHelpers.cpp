#include <IRacingTools/Shared/IPC/NamedPipeHelpers.h>

#include <format>

#define NAMED_PIPE_PREFIX "\\\\.\\pipe\\"
#define NAMED_PIPE_FMT NAMED_PIPE_PREFIX "{}"

namespace IRacingTools::Shared::IPC {

  namespace {
    auto L = Logging::GetCategoryWithName("NamedPipeHelpers");
    std::recursive_mutex gPipeMutex{};
    std::atomic_uint32_t gPipeNameCounter{0};
  }

  bool NamedPipeExists(const std::string& pipeName) {


    std::scoped_lock lock(gPipeMutex);
    auto pipe = CreateFileA(
      pipeName.c_str(),           // pipe name (e.g., L"\\\\.\\pipe\\MyPipe")
      GENERIC_READ |      // desired access
      GENERIC_WRITE,
      0,                  // no sharing
      nullptr,            // default security
      OPEN_EXISTING,      // open existing pipe
      0,                  // default attributes
      nullptr);           // no template file

    if (pipe != INVALID_HANDLE_VALUE) {
      CloseHandle(pipe);
      return true;
    }

    DWORD err = GetLastError();
    return err == ERROR_PIPE_BUSY || err == ERROR_ACCESS_DENIED;
  }

  std::string NextNamedPipeServerName(const std::string& baseName) {
    std::scoped_lock lock(gPipeMutex);

    while (true) {
      std::string pipeName = std::format("{}_{}", baseName, gPipeNameCounter.fetch_add(1));
      auto pipePath = CreateNamedPipePath(pipeName);
      if (!NamedPipeExists(pipePath)) {
        L->info("Named pipe '{}' is available", pipePath);
        return pipePath;
      }

      L->info("Named pipe '{}' exists, trying next", pipePath);
    }
  }

  std::string CreateNamedPipePath(const std::string& pipeName) {
    if (pipeName.starts_with(NAMED_PIPE_PREFIX))
      return pipeName;

    return std::format(NAMED_PIPE_FMT, pipeName);
  };

  std::uint32_t NextNamedPipeConnectionId() {
    static std::atomic_uint32_t ConnectionIdCounter_{0};

    return ConnectionIdCounter_.fetch_add(1);
  };
}
