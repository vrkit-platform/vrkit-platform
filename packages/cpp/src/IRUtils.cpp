/*
Copyright (c) 2013, iRacing.com Motorsport Simulations, LLC.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of iRacing.com Motorsport Simulations nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#define MIN_WIN_VER 0x0501

#ifndef WINVER
#	define WINVER			MIN_WIN_VER
#endif

#ifndef _WIN32_WINNT
#	define _WIN32_WINNT		MIN_WIN_VER
#endif

//#include <windows.h>
#include <cstdio>
#include <ctime>
#include <climits>

#ifdef _MSC_VER
#include <crtdbg.h>
#endif

#include <atomic>
#include <stdexcept>
#include <IRacingTools/SDK/Types.h>

// for timeBeginPeriod()
#pragma comment(lib, "Winmm")
// for RegisterWindowMessage() and SendMessage()
#pragma comment(lib, "User32")

namespace IRacingTools::SDK {
// Local memory
namespace {

HANDLE gDataValidEventHandle{nullptr};
HANDLE gMemMapFileHandle{nullptr};

const char *gSharedMemPtr{nullptr};
const IRHeader *gDataHeader{nullptr};

std::atomic_int gLastTickCount{INT_MAX};
std::atomic_bool gIsInitialized{false};

constexpr double kCommTimeout = 30.0; // kCommTimeout after 30 seconds with no communication
time_t gLastValidTime = 0;
}

// Function Implementations

bool irsdk_startup() {
    if (!gMemMapFileHandle) {
        gMemMapFileHandle = OpenFileMapping(FILE_MAP_READ, FALSE, IRSDK_MEMMAPFILENAME);
        gLastTickCount = INT_MAX;
    }

    if (gMemMapFileHandle) {
        if (!gSharedMemPtr) {
            gSharedMemPtr = static_cast<const char *>(MapViewOfFile(gMemMapFileHandle, FILE_MAP_READ, 0, 0, 0));
            gDataHeader = reinterpret_cast<const IRHeader *>(gSharedMemPtr);
            gLastTickCount = INT_MAX;
        }

        if (gSharedMemPtr) {
            if (!gDataValidEventHandle) {
                gDataValidEventHandle = OpenEvent(SYNCHRONIZE, false, IRSDK_DATAVALIDEVENTNAME);
                gLastTickCount = INT_MAX;
            }

            if (gDataValidEventHandle) {
                gIsInitialized = true;
                return gIsInitialized;
            }
            //else printf("Error opening event: %d\n", GetLastError());
        }
        //else printf("Error mapping file: %d\n", GetLastError());
    }
    //else printf("Error opening file: %d\n", GetLastError());

    gIsInitialized = false;
    return gIsInitialized;
}

void irsdk_shutdown() {
    if (gDataValidEventHandle)
        CloseHandle(gDataValidEventHandle);

    if (gSharedMemPtr)
        UnmapViewOfFile(gSharedMemPtr);

    if (gMemMapFileHandle)
        CloseHandle(gMemMapFileHandle);

    gDataValidEventHandle = nullptr;
    gSharedMemPtr = nullptr;
    gDataHeader = nullptr;
    gMemMapFileHandle = nullptr;

    gIsInitialized = false;
    gLastTickCount = INT_MAX;
}

bool irsdk_getNewData(char *data) {
    if (gIsInitialized || irsdk_startup()) {
#ifdef _MSC_VER
        _ASSERTE(nullptr != gDataHeader);
#endif

        // if sim is not active, then no new data
        if (!(gDataHeader->status & static_cast<int>(IRStatusField::Connected))) {
            gLastTickCount = INT_MAX;
            return false;
        }

        int latest = 0;
        for (int i = 1; i < gDataHeader->numBuf; i++)
            if (gDataHeader->varBuf[latest].tickCount < gDataHeader->varBuf[i].tickCount)
                latest = i;

        // if newer than last recieved, than report new data
        if (gLastTickCount < gDataHeader->varBuf[latest].tickCount) {
            // if asked to retrieve the data
            if (data) {
                // try twice to get the data out
                for (int count = 0; count < 2; count++) {
                    const int curTickCount = gDataHeader->varBuf[latest].tickCount;
                    memcpy(data, gSharedMemPtr + gDataHeader->varBuf[latest].bufOffset, gDataHeader->bufLen);
                    if (curTickCount == gDataHeader->varBuf[latest].tickCount) {
                        gLastTickCount = curTickCount;
                        gLastValidTime = time(nullptr);
                        return true;
                    }
                }
                // if here, the data changed out from under us.
                return false;
            } else {
                gLastTickCount = gDataHeader->varBuf[latest].tickCount;
                gLastValidTime = time(nullptr);
                return true;
            }
        }
        // if older than last recieved, than reset, we probably disconnected
        else if (gLastTickCount > gDataHeader->varBuf[latest].tickCount) {
            gLastTickCount = gDataHeader->varBuf[latest].tickCount;
            return false;
        }
        // else the same, and nothing changed this tick
    }

    return false;
}


bool irsdk_waitForDataReady(int timeOut, char *data) {
#ifdef _MSC_VER
    _ASSERTE(timeOut >= 0);
#endif

    if (gIsInitialized || irsdk_startup()) {
        // just to be sure, check before we sleep
        if (irsdk_getNewData(data))
            return true;

        // sleep till signaled
        WaitForSingleObject(gDataValidEventHandle, timeOut);

        // we woke up, so check for data
        if (irsdk_getNewData(data))
            return true;
        else
            return false;
    }

    // sleep if error
    if (timeOut > 0)
        Sleep(timeOut);

    return false;
}

bool irsdk_isConnected() {
    if (gIsInitialized) {
        const int elapsed = static_cast<int>(difftime(time(nullptr), gLastValidTime));
        return (gDataHeader->status & static_cast<int>(IRStatusField::Connected)) > 0 && elapsed < kCommTimeout;
    }

    return false;
}

const IRHeader *irsdk_getHeader() {
    if (gIsInitialized) {
        return gDataHeader;
    }

    return nullptr;
}

// direct access to the data buffer
// Warnign! This buffer is volitile so read it out fast!
// Use the cached copy from irsdk_waitForDataReady() or irsdk_getNewData() instead
const char *irsdk_getData(int index) {
    if (gIsInitialized) {
        return gSharedMemPtr + gDataHeader->varBuf[index].bufOffset;
    }

    return nullptr;
}

const char *irsdk_getSessionInfoStr() {
    if (gIsInitialized) {
        return gSharedMemPtr + gDataHeader->sessionInfoOffset;
    }
    return nullptr;
}

int irsdk_getSessionInfoStrUpdate() {
    if (gIsInitialized) {
        return gDataHeader->sessionInfoUpdate;
    }
    return -1;
}

const IRVarHeader *irsdk_getVarHeaderPtr() {
    if (gIsInitialized) {
        return ((IRVarHeader *) (gSharedMemPtr + gDataHeader->varHeaderOffset));
    }
    return nullptr;
}

const IRVarHeader *irsdk_getVarHeaderEntry(int index) {
    if (gIsInitialized) {
        if (index >= 0 && index < gDataHeader->numVars) {
            return &((IRVarHeader *) (gSharedMemPtr + gDataHeader->varHeaderOffset))[index];
        }
    }
    return nullptr;
}

// Note: this is a linear search, so cache the results
int irsdk_varNameToIndex(const char *name) {
    const IRVarHeader *pVar;

    if (name) {
        for (int index = 0; index < gDataHeader->numVars; index++) {
            pVar = irsdk_getVarHeaderEntry(index);
            if (pVar && 0 == strncmp(name, pVar->name, IRSDK_MAX_STRING)) {
                return index;
            }
        }
    }

    return -1;
}

int irsdk_varNameToOffset(const char *name) {
    const IRVarHeader *pVar;

    if (name) {
        for (int index = 0; index < gDataHeader->numVars; index++) {
            pVar = irsdk_getVarHeaderEntry(index);
            if (pVar && 0 == strncmp(name, pVar->name, IRSDK_MAX_STRING)) {
                return pVar->offset;
            }
        }
    }

    return -1;
}

unsigned int irsdk_getBroadcastMsgID() {
    static unsigned int msgId = RegisterWindowMessage(IRSDK_BROADCASTMSGNAME);

    return msgId;
}

void irsdk_broadcastMsg(irsdk_BroadcastMsg msg, int var1, int var2, int var3) {
    irsdk_broadcastMsg(msg, var1, static_cast<int>(MAKELONG(var2, var3)));
}

void irsdk_broadcastMsg(irsdk_BroadcastMsg msg, int var1, float var2) {
    // multiply by 2^16-1 to move fractional part to the integer part
    const int real = static_cast<int>(var2 * 65536.0f);

    irsdk_broadcastMsg(msg, var1, real);
}

void irsdk_broadcastMsg(irsdk_BroadcastMsg msg, int var1, int var2) {
    static unsigned int msgId = irsdk_getBroadcastMsgID();

    if (msgId && msg >= 0 && msg < irsdk_BroadcastLast) {
        SendNotifyMessage(HWND_BROADCAST, msgId, MAKELONG(msg, var1), var2);
    }
}

int irsdk_padCarNum(int num, int zero) {
    int retVal = num;
    int numPlace = 1;
    if (num > 99)
        numPlace = 3;
    else if (num > 9)
        numPlace = 2;
    if (zero) {
        numPlace += zero;
        retVal = num + 1000 * numPlace;
    }

    return retVal;
}
}