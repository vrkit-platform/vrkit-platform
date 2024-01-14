//
// Created by jglanz on 1/4/2024.
//

#include "OverlayAppMain.h"

#include "TrackMapWindow.h"

#include <IRacingTools/Shared/SharedMemoryStorage.h>

int WINAPI WinMain(
    HINSTANCE /*hInstance*/,
    HINSTANCE /*hPrevInstance*/,
    LPSTR /*lpCmdLine*/,
    int /*nCmdShow*/
    )
{
  IRacingTools::Apps::Shared::SharedMemoryStorage test;
  test.noop();

  // Ignoring the return value because we want to continue running even in the
  // unlikely event that HeapSetInformation fails.
  HeapSetInformation(nullptr, HeapEnableTerminationOnCorruption, nullptr, 0);

  if (SUCCEEDED(CoInitialize(NULL)))
  {
    {
      TrackMapWindow app;

      if (SUCCEEDED(app.initialize()))
      {
        app.eventLoop();
      }
    }
    CoUninitialize();
  }

  return 0;
}
