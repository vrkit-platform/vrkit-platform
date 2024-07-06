/****************************** Module Header ******************************\
* Module Name:  VRKitService.cpp
* Project:      vrkit-service
* Copyright (c) Microsoft Corporation.
* Copyright (c) Tromgy (tromgy@yahoo.com)
*
* Provides a vrkit service class that derives from the service base class -
* Win32Service. The vrkit service logs the service start and stop
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



#include "Win32AppService.h"
#include "event_ids.h"

Win32AppService::Win32AppService(PCWSTR pszServiceName,
                               BOOL fCanStop,
                               BOOL fCanShutdown,
                               BOOL fCanPauseContinue) :
    Win32Service(pszServiceName, fCanStop, fCanShutdown, fCanPauseContinue, MSG_SVC_FAILURE, CATEGORY_SERVICE)
{
    isStopping_ = false;

    hasStoppedEvent_ = CreateEvent(NULL, TRUE, FALSE, NULL);

    if (hasStoppedEvent_ == NULL)
    {
        throw GetLastError();
    }
}

void Win32AppService::onStart(DWORD /* useleses */, PWSTR* /* useless */)
{
    const wchar_t* configFullPath = SERVICE_CONFIG_FILE;
    bool runAsService = true;

    // Log a service start message to the Application log.
    writeLogEntry(L"VRKit Service is starting...", EVENTLOG_INFORMATION_TYPE, MSG_STARTUP, CATEGORY_SERVICE);

    if (argc_ > 1)
    {
        runAsService = (_wcsicmp(SERVICE_CMD, argv_[1]) == 0);

        // Check if the config file was specified on the service command line
        if (argc_ > 2) // the argument at 1 should be "run mode", so we start at 2
        {
            if (_wcsicmp(L"-config", argv_[2]) == 0)
            {
                if (argc_ > 3)
                {
                    configFullPath = argv_[3];
                }
                else
                {
                    throw std::exception("no configuration file name");
                }
            }
        }
    }
    else
    {
        writeLogEntry(L"VRKit Service:\nNo run mode specified.", EVENTLOG_ERROR_TYPE, MSG_STARTUP, CATEGORY_SERVICE);
        throw std::exception("no run mode specified");
    }

    try
    {
        // Here we would load configuration file
        // but instead we're just writing to event log the configuration file name
        std::wstring infoMsg = L"VRKit Service\n The service is pretending to read configuration from ";
        infoMsg += configFullPath;
        writeLogEntry(infoMsg.c_str(), EVENTLOG_INFORMATION_TYPE, MSG_STARTUP, CATEGORY_SERVICE);
    }
    catch (std::exception const& e)
    {
        WCHAR wszMsg[MAX_PATH];

        _snwprintf_s(wszMsg, _countof(wszMsg), _TRUNCATE, L"VRKit Service\nError reading configuration %S", e.what());

        writeLogEntry(wszMsg, EVENTLOG_ERROR_TYPE, MSG_STARTUP, CATEGORY_SERVICE);
    }

    if (runAsService)
    {
        writeLogEntry(L"VRKit Service will run as a service.", EVENTLOG_INFORMATION_TYPE, MSG_STARTUP, CATEGORY_SERVICE);

        // Add the main service function for execution in a worker thread.
        if (!CreateThread(NULL, 0, ServiceRunner, this, 0, NULL))
        {
            writeLogEntry(L"VRKit Service couldn't create worker thread.", EVENTLOG_ERROR_TYPE, MSG_STARTUP, CATEGORY_SERVICE);
        }
    }
    else
    {
        wprintf(L"VRKit Service is running as a regular process.\n");

        Win32AppService::ServiceRunner(this);
    }
}

Win32AppService::~Win32AppService()
{
}

void Win32AppService::run()
{
    onStart(0, NULL);
}

DWORD __stdcall Win32AppService::ServiceRunner(void* self)
{
    Win32AppService* service = (Win32AppService*)self;

    service->writeLogEntry(L"VRKit Service has started.", EVENTLOG_INFORMATION_TYPE, MSG_STARTUP, CATEGORY_SERVICE);

    // Periodically check if the service is stopping.
    //for (bool once = true; !service->isStopping_; once = false)
    while(true)
    {
        if (service->isStopping_)  {
            service->writeLogEntry(L"STOPPING Service, Exiting Runner", EVENTLOG_INFORMATION_TYPE, MSG_OPERATION, CATEGORY_SERVICE);    
            break;
        }
        
        service->writeLogEntry(L"VRKit Service is pretending to be working:\nStarting fake job 1...\nStarting fake job 2...\nStarting fake job 3...", EVENTLOG_INFORMATION_TYPE, MSG_OPERATION, CATEGORY_SERVICE);

        // Just pretend to do some work
        Sleep(15000);
    }

    // Signal the stopped event.
    SetEvent(service->hasStoppedEvent_);
    service->writeLogEntry(L"VRKit Service has stopped.", EVENTLOG_INFORMATION_TYPE, MSG_SHUTDOWN, CATEGORY_SERVICE);

    return 0;
}

void Win32AppService::onStop()
{
    // Log a service stop message to the Application log.
    writeLogEntry(L"VRKit Service is stopping", EVENTLOG_INFORMATION_TYPE, MSG_SHUTDOWN, CATEGORY_SERVICE);

    // Indicate that the service is stopping and wait for the finish of the
    // main service function (ServiceWorkerThread).
    isStopping_ = true;

    if (WaitForSingleObject(hasStoppedEvent_, INFINITE) != WAIT_OBJECT_0)
    {
        throw GetLastError();
    }
}
