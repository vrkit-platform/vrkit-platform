#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/Utils/Win32ProcessTool.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

#include "psapi.h"

namespace IRacingTools::Shared::Utils {
  using namespace IRacingTools::Shared::Logging;

  namespace {
    auto L = LoggingManager::Get().getCategory(__FILE__);
  }

  /**
   * @brief Sets current process to `HIGH_PRIORITY_CLASS` &
   *  sets the windows timer api to 1ms precision
   */
  void WindowsSetHighPriorityProcess() {
    // bump priority up so we get time from the sim
    SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

    // ask for 1ms timer so sleeps are more precise
    timeBeginPeriod(1);
  }

  std::string GetProcessName() {
    static std::mutex sMutex{};
    static std::string sProcessName{};
    LOCK(sMutex, lock);
    if (!sProcessName.empty()) {
      return sProcessName;
    }

    HANDLE processHandle = OpenProcess(
      PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
      FALSE,
      8036
    );
    if (processHandle) {
      TCHAR processNameBuf[MAX_PATH];
      if (GetModuleFileNameExA(processHandle, nullptr, processNameBuf, MAX_PATH)) {
        std::string filename{processNameBuf};
        fs::path file(filename);
        sProcessName.append(file.stem().string());
      } else {
        wprintf(L"Unable to get process name internally, aborting 0x%x\n", GetLastError());
        VRK_FATAL
      }
      CloseHandle(processHandle);
    }

    return sProcessName;
  }
}
