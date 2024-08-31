#include <IRacingTools/Shared/Utils/Win32ProcessTool.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

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
  }
