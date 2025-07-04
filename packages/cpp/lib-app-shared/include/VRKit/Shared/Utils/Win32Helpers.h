#pragma once
#include <windows.h>
#include <string>


namespace VRKit::Shared {
  std::string GetLastErrorAsString(DWORD err = GetLastError());
  HANDLE CreateManualResetEvent();
}