/****************************** Module Header ******************************\
* Module Name:  SampleService.h
* Project:      sample-service
* Copyright (c) Microsoft Corporation.
* Copyright (c) Tromgy (tromgy@yahoo.com)
*
* Provides a sample service class that derives from the service base class -
* Win32Service. The sample service logs the service start and stop
* information to the Application event log, and shows how to run the main
* function of the service in a thread pool worker thread.
*
* This source is subject to the Microsoft Public License.
* See http://www.microsoft.com/en-us/openness/resources/licenses.aspx#MPL.
* All other rights reserved.
*
* THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND,
* EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.
\***************************************************************************/

#pragma once

#include "Win32Service/Win32ServiceBase.h"
#include <string>
#include <atomic>

// Default service start options.
#define SERVICE_START_TYPE       SERVICE_AUTO_START

// List of service dependencies (none)
#define SERVICE_DEPENDENCIES     L""

// Default name of the account under which the service should run
#define SERVICE_ACCOUNT          L"NT AUTHORITY\\LocalService"

// Default password to the service account name
#define SERVICE_PASSWORD         NULL

// Configuration file
#define SERVICE_CONFIG_FILE      L"config.cfg"

// Command to run as a service
#define SERVICE_CMD              L"serve"

// Command to run as a stand-alone process
#define PROCESS_CMD              L"run"

// Service name
#define SERVICE_NAME             L"vrkit-service"

// Service name as displayed in MMC
#define SERVICE_DISP_NAME        L"VRKit service"

// Service description as displayed in MMC
#define SERVICE_DESC             L"VRKit (VirtualRacingKit) supports the VRKit App."

class Win32AppService: public Win32Service
{
  public:
    Win32AppService(PCWSTR pszServiceName,
                   BOOL fCanStop = TRUE,
                   BOOL fCanShutdown = TRUE,
                   BOOL fCanPauseContinue = FALSE
                  );
    ~Win32AppService();

    virtual void onStart(DWORD dwArgc, PWSTR *pszArgv) override;

    virtual void onStop()  override;

    static DWORD __stdcall  ServiceRunner(void* self);

    void run();

  private:
    std::atomic_bool isStopping_;
    HANDLE hasStoppedEvent_;
    std::wstring wstrParam_;
};

