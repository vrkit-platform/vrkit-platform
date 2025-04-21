#pragma once
#include <windows.h>
#include <string>


namespace IRacingTools::Shared {
  std::string GetLastErrorAsString(DWORD err = GetLastError());
  HANDLE CreateManualResetEvent();
}