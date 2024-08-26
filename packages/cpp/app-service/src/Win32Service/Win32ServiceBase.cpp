/****************************** Module Header ******************************\
* Module Name:  ServiceBase.cpp
* Project:      service-base
* Copyright (c) Microsoft Corporation.
* Copyright (c) Tromgy (tromgy@yahoo.com)
*
* Provides a base class for a service that will exist as part of a service
* application. Win32Service must be derived from when creating a new service
* class.
*
* This source is subject to the Microsoft Public License.
* See http://www.microsoft.com/en-us/openness/resources/licenses.aspx#MPL.
* All other rights reserved.
*
* THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND,
* EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.
\***************************************************************************/

#pragma region Includes
#include <assert.h>
#include <strsafe.h>

#include "Win32ServiceBase.h"
#pragma endregion


#pragma region Static Members

// Initialize the singleton service instance.
Win32Service *Win32Service::Service_ = NULL;


//
//   FUNCTION: Win32Service::run(Win32Service &)
//
//   PURPOSE: Register the executable for a service with the Service Control
//   Manager (SCM). After you call Run(ServiceBase), the SCM issues a Start
//   command, which results in a call to the OnStart method in the service.
//   This method blocks until the service has stopped.
//
//   PARAMETERS:
//   * service - the reference to a Win32Service object. It will become the
//     singleton service instance of this service application.
//
//   RETURN VALUE: If the function succeeds, the return value is TRUE. If the
//   function fails, the return value is FALSE. To get extended error
//   information, call GetLastError.
//
BOOL Win32Service::Run(Win32Service &service)
{
    Service_ = &service;

    SERVICE_TABLE_ENTRYW serviceTable[] =
    {
        { const_cast<LPWSTR>(service.name_), ServiceMain },
        { NULL, NULL }
    };

    // Connects the main thread of a service process to the service control
    // manager, which causes the thread to be the service control dispatcher
    // thread for the calling process. This call returns when the service has
    // stopped. The process should simply terminate when the call returns.
    return StartServiceCtrlDispatcherW(serviceTable);
}


//
//   FUNCTION: Win32Service::serviceMain(DWORD, PWSTR *)
//
//   PURPOSE: Entry point for the service. It registers the handler function
//   for the service and starts the service.
//
//   PARAMETERS:
//   * dwArgc   - number of command line arguments
//   * lpszArgv - array of command line arguments
//
void WINAPI Win32Service::ServiceMain(DWORD dwArgc, PWSTR *pszArgv)
{
    assert(Service_ != NULL);

    // Register the handler function for the service
    Service_->statusHandle_ = RegisterServiceCtrlHandlerW(
                                    Service_->name_, ServiceCtrlHandler);
    if (Service_->statusHandle_ == NULL)
    {
        throw GetLastError();
    }

    // Start the service.
    Service_->start(dwArgc, pszArgv);
}


//
//   FUNCTION: Win32Service::serviceCtrlHandler(DWORD)
//
//   PURPOSE: The function is called by the SCM whenever a control code is
//   sent to the service.
//
//   PARAMETERS:
//   * dwCtrlCode - the control code. This parameter can be one of the
//   following values:
//
//     SERVICE_CONTROL_CONTINUE
//     SERVICE_CONTROL_INTERROGATE
//     SERVICE_CONTROL_NETBINDADD
//     SERVICE_CONTROL_NETBINDDISABLE
//     SERVICE_CONTROL_NETBINDREMOVE
//     SERVICE_CONTROL_PARAMCHANGE
//     SERVICE_CONTROL_PAUSE
//     SERVICE_CONTROL_SHUTDOWN
//     SERVICE_CONTROL_STOP
//
//   This parameter can also be a user-defined control code ranges from 128
//   to 255.
//
void WINAPI Win32Service::ServiceCtrlHandler(DWORD dwCtrl)
{
    switch (dwCtrl)
    {
        case SERVICE_CONTROL_STOP:
            Service_->stop();
            break;
        case SERVICE_CONTROL_PAUSE:
            Service_->pause();
            break;
        case SERVICE_CONTROL_CONTINUE:
            Service_->resume();
            break;
        case SERVICE_CONTROL_SHUTDOWN:
            Service_->shutdown();
            break;
        case SERVICE_CONTROL_INTERROGATE:
            break;
        default:
            break;
    }
}

#pragma endregion


#pragma region Service Constructor and Destructor

//
//   FUNCTION: Win32Service::win32Service(PWSTR, BOOL, BOOL, BOOL)
//
//   PURPOSE: The constructor of Win32Service. It initializes a new instance
//   of the Win32Service class. The optional parameters (fCanStop,
///  fCanShutdown and fCanPauseContinue) allow you to specify whether the
//   service can be stopped, paused and continued, or be notified when system
//   shutdown occurs.
//
//   PARAMETERS:
//   * pszServiceName - the name of the service
//   * fCanStop - the service can be stopped
//   * fCanShutdown - the service is notified when system shutdown occurs
//   * fCanPauseContinue - the service can be paused and continued
//   * dwErrorEventId - the event id for the error log messages
//   * wErrorCategoryId - the event category for the error log messages.
//
Win32Service::Win32Service(PCWSTR pszServiceName,
                           BOOL fCanStop,
                           BOOL fCanShutdown,
                           BOOL fCanPauseContinue,
                           DWORD dwErrorEventId,
                           WORD wErrorCategoryId)
{
    // Service name must be a valid string and cannot be NULL.
    name_ = (pszServiceName == NULL) ? const_cast<PWSTR>(L"") : pszServiceName;

    statusHandle_ = NULL;

    // The service runs in its own process.
    status_.dwServiceType = SERVICE_WIN32_OWN_PROCESS;

    // The service is starting.
    status_.dwCurrentState = SERVICE_START_PENDING;

    // The accepted commands of the service.
    DWORD dwControlsAccepted = 0;
    if (fCanStop)
        dwControlsAccepted |= SERVICE_ACCEPT_STOP;
    if (fCanShutdown)
        dwControlsAccepted |= SERVICE_ACCEPT_SHUTDOWN;
    if (fCanPauseContinue)
        dwControlsAccepted |= SERVICE_ACCEPT_PAUSE_CONTINUE;
    status_.dwControlsAccepted = dwControlsAccepted;

    status_.dwWin32ExitCode = NO_ERROR;
    status_.dwServiceSpecificExitCode = 0;
    status_.dwCheckPoint = 0;
    status_.dwWaitHint = 0;

    dwErrorEventId_ = dwErrorEventId;
    wErrorCategoryId_ = wErrorCategoryId;
}


//
//   FUNCTION: Win32Service::~Win32Service()
//
//   PURPOSE: The virtual destructor of Win32Service.
//
Win32Service::~Win32Service(void)
{
}

#pragma endregion


#pragma region Service Start, Stop, Pause, Continue, and Shutdown

//
//   FUNCTION: Win32Service::start(DWORD, PWSTR *)
//
//   PURPOSE: The function starts the service. It calls the OnStart virtual
//   function in which you can specify the actions to take when the service
//   starts. If an error occurs during the startup, the error will be logged
//   in the Application event log, and the service will be stopped.
//
//   PARAMETERS:
//   * dwArgc   - number of command line arguments
//   * lpszArgv - array of command line arguments
//
void Win32Service::start(DWORD dwArgc, PWSTR *pszArgv)
{
    try
    {
        // Tell SCM that the service is starting.
        setServiceStatus(SERVICE_START_PENDING);

        // Perform service-specific initialization.
        onStart(dwArgc, pszArgv);

        // Tell SCM that the service is started.
        setServiceStatus(SERVICE_RUNNING);
    }
    catch (DWORD dwError)
    {
        // Log the error.
        writeErrorLogEntry(L"Service Start", dwError);

        // Set the service status to be stopped.
        setServiceStatus(SERVICE_STOPPED, dwError);
    }
    catch (...)
    {
        // Log the error.
        writeLogEntry(L"Service failed to start.", EVENTLOG_ERROR_TYPE, dwErrorEventId_, wErrorCategoryId_);

        // Set the service status to be stopped.
        setServiceStatus(SERVICE_STOPPED);
    }
}


//
//   FUNCTION: Win32Service::onStart(DWORD, PWSTR *)
//
//   PURPOSE: When implemented in a derived class, executes when a Start
//   command is sent to the service by the SCM or when the operating system
//   starts (for a service that starts automatically). Specifies actions to
//   take when the service starts. Be sure to periodically call
//   Win32Service::setServiceStatus() with SERVICE_START_PENDING if the
//   procedure is going to take long time. You may also consider spawning a
//   new thread in OnStart to perform time-consuming initialization tasks.
//
//   PARAMETERS:
//   * dwArgc   - number of command line arguments
//   * lpszArgv - array of command line arguments
//
void Win32Service::onStart(DWORD dwArgc, PWSTR *pszArgv)
{
}


//
//   FUNCTION: Win32Service::stop()
//
//   PURPOSE: The function stops the service. It calls the OnStop virtual
//   function in which you can specify the actions to take when the service
//   stops. If an error occurs, the error will be logged in the Application
//   event log, and the service will be restored to the original state.
//
void Win32Service::stop()
{
    DWORD dwOriginalState = status_.dwCurrentState;
    try
    {
        // Tell SCM that the service is stopping.
        setServiceStatus(SERVICE_STOP_PENDING);

        // Perform service-specific stop operations.
        onStop();

        // Tell SCM that the service is stopped.
        setServiceStatus(SERVICE_STOPPED);
    }
    catch (DWORD dwError)
    {
        // Log the error.
        writeErrorLogEntry(L"Service Stop", dwError);

        // Set the orginal service status.
        setServiceStatus(dwOriginalState);
    }
    catch (...)
    {
        // Log the error.
        writeLogEntry(L"Service failed to stop.", EVENTLOG_ERROR_TYPE, dwErrorEventId_, wErrorCategoryId_);

        // Set the orginal service status.
        setServiceStatus(dwOriginalState);
    }
}


//
//   FUNCTION: Win32Service::onStop()
//
//   PURPOSE: When implemented in a derived class, executes when a Stop
//   command is sent to the service by the SCM. Specifies actions to take
//   when a service stops running. Be sure to periodically call
//   Win32Service::setServiceStatus() with SERVICE_STOP_PENDING if the
//   procedure is going to take long time.
//
void Win32Service::onStop()
{
}


//
//   FUNCTION: Win32Service::pause()
//
//   PURPOSE: The function pauses the service if the service supports pause
//   and continue. It calls the OnPause virtual function in which you can
//   specify the actions to take when the service pauses. If an error occurs,
//   the error will be logged in the Application event log, and the service
//   will become running.
//
void Win32Service::pause()
{
    try
    {
        // Tell SCM that the service is pausing.
        setServiceStatus(SERVICE_PAUSE_PENDING);

        // Perform service-specific pause operations.
        onPause();

        // Tell SCM that the service is paused.
        setServiceStatus(SERVICE_PAUSED);
    }
    catch (DWORD dwError)
    {
        // Log the error.
        writeErrorLogEntry(L"Service Pause", dwError);

        // Tell SCM that the service is still running.
        setServiceStatus(SERVICE_RUNNING);
    }
    catch (...)
    {
        // Log the error.
        writeLogEntry(L"Service failed to pause.", EVENTLOG_ERROR_TYPE, dwErrorEventId_, wErrorCategoryId_);

        // Tell SCM that the service is still running.
        setServiceStatus(SERVICE_RUNNING);
    }
}


//
//   FUNCTION: Win32Service::onPause()
//
//   PURPOSE: When implemented in a derived class, executes when a Pause
//   command is sent to the service by the SCM. Specifies actions to take
//   when a service pauses.
//
void Win32Service::onPause()
{
}


//
//   FUNCTION: Win32Service::continue()
//
//   PURPOSE: The function resumes normal functioning after being paused if
//   the service supports pause and continue. It calls the OnContinue virtual
//   function in which you can specify the actions to take when the service
//   continues. If an error occurs, the error will be logged in the
//   Application event log, and the service will still be paused.
//
void Win32Service::resume()
{
    try
    {
        // Tell SCM that the service is resuming.
        setServiceStatus(SERVICE_CONTINUE_PENDING);

        // Perform service-specific continue operations.
        onContinue();

        // Tell SCM that the service is running.
        setServiceStatus(SERVICE_RUNNING);
    }
    catch (DWORD dwError)
    {
        // Log the error.
        writeErrorLogEntry(L"Service Continue", dwError);

        // Tell SCM that the service is still paused.
        setServiceStatus(SERVICE_PAUSED);
    }
    catch (...)
    {
        // Log the error.
        writeLogEntry(L"Service failed to resume.", EVENTLOG_ERROR_TYPE, dwErrorEventId_, wErrorCategoryId_);

        // Tell SCM that the service is still paused.
        setServiceStatus(SERVICE_PAUSED);
    }
}


//
//   FUNCTION: Win32Service::onContinue()
//
//   PURPOSE: When implemented in a derived class, OnContinue runs when a
//   Continue command is sent to the service by the SCM. Specifies actions to
//   take when a service resumes normal functioning after being paused.
//
void Win32Service::onContinue()
{
}


//
//   FUNCTION: Win32Service::shutdown()
//
//   PURPOSE: The function executes when the system is shutting down. It
//   calls the OnShutdown virtual function in which you can specify what
//   should occur immediately prior to the system shutting down. If an error
//   occurs, the error will be logged in the Application event log.
//
void Win32Service::shutdown()
{
    try
    {
        // Perform service-specific shutdown operations.
        onShutdown();

        // Tell SCM that the service is stopped.
        setServiceStatus(SERVICE_STOPPED);
    }
    catch (DWORD dwError)
    {
        // Log the error.
        writeErrorLogEntry(L"Service Shutdown", dwError);
    }
    catch (...)
    {
        // Log the error.
        writeLogEntry(L"Service failed to shut down.", EVENTLOG_ERROR_TYPE, dwErrorEventId_, wErrorCategoryId_);
    }
}


//
//   FUNCTION: Win32Service::onShutdown()
//
//   PURPOSE: When implemented in a derived class, executes when the system
//   is shutting down. Specifies what should occur immediately prior to the
//   system shutting down.
//
void Win32Service::onShutdown()
{
}

#pragma endregion


#pragma region Helper Functions

//
//   FUNCTION: Win32Service::setServiceStatus(DWORD, DWORD, DWORD)
//
//   PURPOSE: The function sets the service status and reports the status to
//   the SCM.
//
//   PARAMETERS:
//   * dwCurrentState - the state of the service
//   * dwWin32ExitCode - error code to report
//   * dwWaitHint - estimated time for pending operation, in milliseconds
//
void Win32Service::setServiceStatus(DWORD dwCurrentState,
                                    DWORD dwWin32ExitCode,
                                    DWORD dwWaitHint)
{
    static DWORD dwCheckPoint = 1;

    // Fill in the SERVICE_STATUS structure of the service.

    status_.dwCurrentState = dwCurrentState;
    status_.dwWin32ExitCode = dwWin32ExitCode;
    status_.dwWaitHint = dwWaitHint;

    status_.dwCheckPoint =
        ((dwCurrentState == SERVICE_RUNNING) ||
         (dwCurrentState == SERVICE_STOPPED)) ?
        0 : dwCheckPoint++;

    // Report the status of the service to the SCM.
    ::SetServiceStatus(statusHandle_, &status_);
}


//
//   FUNCTION: Win32Service::writeEventLogEntry(PWSTR, WORD)
//
//   PURPOSE: Log a message to the Application event log.
//
//   PARAMETERS:
//   * pszMessage - string(s) of the message to be logged.
//     to display multiple strings in Windows Event Viewer "Details" page separate them with '\n'
//   * wType - the type of event to be logged. The parameter can be one of
//     the following values.
//
//     EVENTLOG_SUCCESS
//     EVENTLOG_AUDIT_FAILURE
//     EVENTLOG_AUDIT_SUCCESS
//     EVENTLOG_ERROR_TYPE
//     EVENTLOG_INFORMATION_TYPE
//     EVENTLOG_WARNING_TYPE
//   * dwEventId - event id. A string with this id should exist in the message file
//     that gets compiled into the resources. The file that contains those resources
//     is then supposed to be registered with the system.
//   * wCategory - category id. This is similar to event id, but the corresponding string
//     is shown in a separate column in Windows Event Viewer.
//
//   NOTE: It can be overridden to do any other kind of logging in a sublcass
//

void Win32Service::writeLogEntry(PCWSTR pszMessage, WORD wType, DWORD dwEventId, WORD wCategory)
{
    HANDLE hEventSource = NULL;
    PWSTR pszSource;             // Copy of pszMessage for splitting
    PCWSTR* pszStrings;          // Message strings to shown on the "Details" tab in Event Viewer
    WCHAR* pContext;             // Tokenization context
    WCHAR delimiter = L'\n';     // Strings are delimited by new lines
    WORD nStrings = 1;           // Number of strings in the message

    // Prepare event strings by splitting the message at new lines

    // Copy the input string as tokenizing modifies the source
    pszSource = _wcsdup(pszMessage);

    if (pszSource == NULL)
    {
        return;
    }

    // First find the number of strings
    for (PCWSTR pOccur = wcschr(pszMessage, delimiter); pOccur != NULL; pOccur = wcschr(++pOccur, delimiter))
    {
        nStrings++;
    }

    try
    {
        // Allocate the array of strings
        pszStrings = new PCWSTR[nStrings];
    }
    catch (...)
    {
        delete pszSource;
        return;
    }

    // Token index
    WORD i = 0;

    for (LPCWSTR token = wcstok_s(pszSource, &delimiter, &pContext); token != NULL; token = wcstok_s(NULL, &delimiter, &pContext))
    {
        pszStrings[i++] = token;
    }

    hEventSource = RegisterEventSourceW(NULL, name_);

    if (hEventSource)
    {
        ReportEventW(hEventSource,          // Event log handle
                    wType,                 // Event type
                    wCategory,             // Event category
                    dwEventId,             // Event identifier
                    NULL,                  // No security identifier
                    nStrings,              // Size of lpszStrings array
                    0,                     // No binary data
                    pszStrings,            // Array of strings
                    NULL                   // No binary data
                   );

        DeregisterEventSource(hEventSource);
    }

    // Free heap memory
    delete[] pszStrings;

    delete pszSource;
}

//
//   FUNCTION: Win32Service::writeErrorLogEntry(PWSTR, DWORD)
//
//   PURPOSE: Log an error message to the Application event log.
//
//   PARAMETERS:
//   * pszFunction - the function that gives the error
//   * dwError - the error code
//
void Win32Service::writeErrorLogEntry(PCWSTR pszFunction, DWORD dwError)
{
    wchar_t szMessage[260];
    StringCchPrintfW(szMessage, ARRAYSIZE(szMessage),
                    L"%s failed with error code 0x%08lx", pszFunction, dwError);
    writeLogEntry(szMessage, EVENTLOG_ERROR_TYPE, dwErrorEventId_, wErrorCategoryId_);
}

#pragma endregion