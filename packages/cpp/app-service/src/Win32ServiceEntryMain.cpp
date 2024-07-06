//
// Created by jglanz on 1/4/2024.
//

#include "Win32ServiceEntryMain.h"
#include <shellapi.h>
#include <windows.h>
#include <winrt/base.h>
#include <regex>

#include <fmt/core.h>
#include <CLI/CLI.hpp>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Graphics/DX11Resources.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SHM/SHM.h>


#include "Win32AppService.h"
#include "Win32Service/Win32ServiceInstaller.h"

using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::App::Win32Service;

// int WINAPI WinMain(
//     HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/, LPSTR /*lpCmdLine*/, int /*nCmdShow*/
// ) {

    // auto wcmdline = GetCommandLineW();
    // auto cmdline = ToUtf8(wcmdline);

    // CLI::App cli{"IRacing Tools Overlays"};

    // std::string filename;
    // cli.add_option("-f,--file", filename, "track map file");

    // cli.parse(cmdline, true);
    // LOGD(fmt::format("parsed filename: {}", filename));
    
    // auto shm = IRacingTools::Shared::SHM::GetInstance();
    // winrt::check_bool(shm->loadTrackMapFromTrajectoryFile(filename));

    // // Ignoring the return value because we want to continue running even in the
    // // unlikely event that HeapSetInformation fails.
    // HeapSetInformation(nullptr, HeapEnableTerminationOnCorruption, nullptr, 0);

    // winrt::check_hresult(CoInitialize(nullptr));
    // {
    //     TrackMapWindow app;
    //     winrt::check_hresult(app.initialize());
    //     app.eventLoop();
    // }
    // CoUninitialize();


//     return 0;
// }


using namespace std;

int wmain(int argc, wchar_t *argv[])
{
   // Service parameters
   DWORD dwSvcStartType = SERVICE_START_TYPE;
   PCWSTR wsSvcAccount = SERVICE_ACCOUNT;
   PCWSTR wsSvcPwd = SERVICE_PASSWORD;
   PCWSTR wsConfigFullPath = SERVICE_CONFIG_FILE;
   WCHAR wsServiceParams[MAX_PATH] = SERVICE_CMD;

   if (argc > 1)
   {
      if (_wcsicmp(L"install", argv[1]) == 0)
      {
         try
         {
            for (int i = 2; i < argc; i++)
            {
               PWSTR arg = argv[i];

               if (arg[0] == '-')
               {
                  if (_wcsicmp(L"-start-type", arg) == 0)
                  {
                     if (argc > i)
                     {
                        PCWSTR wsStartType = argv[++i];

                        if (regex_match(wsStartType, wregex(L"[2-4]")))
                        {
                           dwSvcStartType = _wtol(wsStartType);
                        }
                        else
                        {
                           throw exception("service start type must be a number between 2 and 4");
                        }
                     }
                     else
                     {
                        throw exception("no startup type specified after -start-type");
                     }
                  }
                  else if (_wcsicmp(L"-account", arg) == 0)
                  {
                     if (argc > i)
                     {
                        wsSvcAccount = argv[++i];
                     }
                     else
                     {
                        throw exception("no account name after -account");
                     }
                  }
                  else if (_wcsicmp(L"-password", arg) == 0)
                  {
                     if (argc > i)
                     {
                        wsSvcPwd = argv[++i];
                     }
                     else
                     {
                        throw exception("no password  after -password");
                     }
                  }
                  else if (_wcsicmp(L"-config", arg) == 0)
                  {
                     if (argc > i)
                     {
                        _snwprintf_s(wsServiceParams, _countof(wsServiceParams), _TRUNCATE, L"%s -config \"%s\"", SERVICE_CMD, argv[++i]);
                     }
                     else
                     {
                        throw exception("no configuration file specified");
                     }
                  }
                  else
                  {
                     char errMsg[MAX_PATH];
                     _snprintf_s(errMsg, _countof(errMsg), _TRUNCATE, "unknown parameter: %S", arg);

                     throw exception(errMsg);
                  }
               }
            }

            InstallService(
               SERVICE_NAME,               // Name of service
               SERVICE_DISP_NAME,          // Display name
               SERVICE_DESC,               // Description
               wsServiceParams,            // Command-line parameters to pass to the service
               dwSvcStartType,             // Service start type
               SERVICE_DEPENDENCIES,       // Dependencies
               wsSvcAccount,               // Service running account
               wsSvcPwd,                   // Password of the account
               TRUE,                       // Register with Windows Event Log, so our log messages will be found in Event Viewer
               1,                          // We have only one event category, "Service"
               NULL                        // No separate resource file, use resources in main executable for messages (default)
            );
         }
         catch (exception const& ex)
         {
            wprintf(L"Couldn't install service: %S", ex.what());
            return 1;
         }
         catch (...)
         {
            wprintf(L"Couldn't install service: unexpected error");
            return 2;
         }
      }
      else if (_wcsicmp(L"uninstall", argv[1]) == 0)
      {
         UninstallService(SERVICE_NAME);
      }
      else if (_wcsicmp(SERVICE_CMD, argv[1]) == 0)
      {
         Win32AppService service(SERVICE_NAME);

         service.setCommandLine(argc, argv);

         if (!Win32Service::Run(service))
         {
            DWORD dwErr = GetLastError();

            wprintf(L"Service failed to run with error code: 0x%08lx\n", dwErr);

            return dwErr;
         }
      }
      else if (_wcsicmp(PROCESS_CMD, argv[1]) == 0)
      {
         Win32AppService service(SERVICE_NAME);

         service.setCommandLine(argc, argv);

         service.run();
      }
      else
      {
         wprintf(L"Unknown parameter: %s\n", argv[1]);
      }
   }
   else
   {
      printf(APP_NAME "\n");
      wprintf(L"Parameters:\n\n");
      wprintf(L" install [-start-type <2..4> -account <account-name> -password <account-password> -config <configuration-file-path>]\n  - to install the service.\n");
      wprintf(L"    service start types are:\n");
      wprintf(L"     2 - service started automatically by the service control manager during system startup.\n");
      wprintf(L"     3 - service started manually or by calling StartService function from another process.\n");
      wprintf(L"     4 - service installed in the \"disabled\" state, and cannot be started until enabled.\n");
      wprintf(L" run [-config <configuration-file-path>]\n  - to start as a regular process (not a service)\n");
      wprintf(L" uninstall\n  - to remove the service.\n");
   }

   return 0;
}


