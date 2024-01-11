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
#include <stdio.h>
#include <time.h>
#include <limits.h>

#ifdef _MSC_VER
#include <crtdbg.h>
#endif

#include <irsdk-cpp/IRTypes.h>

// for timeBeginPeriod()
#pragma comment(lib, "Winmm")
// for RegisterWindowMessage() and SendMessage()
#pragma comment(lib, "User32")

// Local memory

static HANDLE hDataValidEvent = nullptr;
static HANDLE hMemMapFile = nullptr;

static const char *pSharedMem = nullptr;
static const IRHeader *pHeader = nullptr;

static int lastTickCount = INT_MAX;
static bool isInitialized = false;

static const double timeout = 30.0; // timeout after 30 seconds with no communication
static time_t lastValidTime = 0;

// Function Implementations

bool irsdk_startup()
{
	if(!hMemMapFile)
	{
		hMemMapFile = OpenFileMapping( FILE_MAP_READ, FALSE, IRSDK_MEMMAPFILENAME);
		lastTickCount = INT_MAX;
	}

	if(hMemMapFile)
	{
		if(!pSharedMem)
		{
			pSharedMem = static_cast<const char *>(MapViewOfFile(hMemMapFile, FILE_MAP_READ, 0, 0, 0));
			pHeader = (IRHeader *)pSharedMem;
			lastTickCount = INT_MAX;
		}

		if(pSharedMem)
		{
			if(!hDataValidEvent)
			{
				hDataValidEvent = OpenEvent(SYNCHRONIZE, false, IRSDK_DATAVALIDEVENTNAME);
				lastTickCount = INT_MAX;
			}

			if(hDataValidEvent)
			{
				isInitialized = true;
				return isInitialized;
			}
			//else printf("Error opening event: %d\n", GetLastError());
		}
		//else printf("Error mapping file: %d\n", GetLastError());
	}
	//else printf("Error opening file: %d\n", GetLastError());

	isInitialized = false;
	return isInitialized;
}

void irsdk_shutdown()
{
	if(hDataValidEvent)
		CloseHandle(hDataValidEvent);

	if(pSharedMem)
		UnmapViewOfFile(pSharedMem);

	if(hMemMapFile)
		CloseHandle(hMemMapFile);

	hDataValidEvent = nullptr;
	pSharedMem = nullptr;
	pHeader = nullptr;
	hMemMapFile = nullptr;

	isInitialized = false;
	lastTickCount = INT_MAX;
}

bool irsdk_getNewData(char *data)
{
	if(isInitialized || irsdk_startup())
	{
#ifdef _MSC_VER
		_ASSERTE(NULL != pHeader);
#endif

		// if sim is not active, then no new data
		if(!(pHeader->status & static_cast<int>(IRStatusField::Connected)))
		{
			lastTickCount = INT_MAX;
			return false;
		}

		int latest = 0;
		for(int i=1; i<pHeader->numBuf; i++)
			if(pHeader->varBuf[latest].tickCount < pHeader->varBuf[i].tickCount)
			   latest = i;

		// if newer than last recieved, than report new data
		if(lastTickCount < pHeader->varBuf[latest].tickCount)
		{
			// if asked to retrieve the data
			if(data)
			{
				// try twice to get the data out
				for(int count = 0; count < 2; count++)
				{
					const int curTickCount =  pHeader->varBuf[latest].tickCount;
					memcpy(data, pSharedMem + pHeader->varBuf[latest].bufOffset, pHeader->bufLen);
					if(curTickCount ==  pHeader->varBuf[latest].tickCount)
					{
						lastTickCount = curTickCount;
						lastValidTime = time(nullptr);
						return true;
					}
				}
				// if here, the data changed out from under us.
				return false;
			}
			else
			{
				lastTickCount =  pHeader->varBuf[latest].tickCount;
				lastValidTime = time(nullptr);
				return true;
			}
		}
		// if older than last recieved, than reset, we probably disconnected
		else if(lastTickCount >  pHeader->varBuf[latest].tickCount)
		{
			lastTickCount =  pHeader->varBuf[latest].tickCount;
			return false;
		}
		// else the same, and nothing changed this tick
	}

	return false;
}


bool irsdk_waitForDataReady(int timeOut, char *data)
{
#ifdef _MSC_VER
	_ASSERTE(timeOut >= 0);
#endif

	if(isInitialized || irsdk_startup())
	{
		// just to be sure, check before we sleep
		if(irsdk_getNewData(data))
			return true;

		// sleep till signaled
		WaitForSingleObject(hDataValidEvent, timeOut);

		// we woke up, so check for data
		if(irsdk_getNewData(data))
			return true;
		else
			return false;
	}

	// sleep if error
	if(timeOut > 0)
		Sleep(timeOut);

	return false;
}

bool irsdk_isConnected()
{
	if(isInitialized)
	{
		const int elapsed = static_cast<int>(difftime(time(nullptr), lastValidTime));
		return (pHeader->status & static_cast<int>(IRStatusField::Connected)) > 0 && elapsed < timeout;
	}

	return false;
}

const IRHeader *irsdk_getHeader()
{
	if(isInitialized)
	{
		return pHeader;
	}

	return nullptr;
}

// direct access to the data buffer
// Warnign! This buffer is volitile so read it out fast!
// Use the cached copy from irsdk_waitForDataReady() or irsdk_getNewData() instead
const char *irsdk_getData(int index)
{
	if(isInitialized)
	{
		return pSharedMem + pHeader->varBuf[index].bufOffset;
	}

	return nullptr;
}

const char *irsdk_getSessionInfoStr()
{
	if(isInitialized)
	{
		return pSharedMem + pHeader->sessionInfoOffset;
	}
	return nullptr;
}

int irsdk_getSessionInfoStrUpdate()
{
	if(isInitialized)
	{
		return pHeader->sessionInfoUpdate;
	}
	return -1;
}

const IRVarHeader *irsdk_getVarHeaderPtr()
{
	if(isInitialized)
	{
		return ((IRVarHeader*)(pSharedMem + pHeader->varHeaderOffset));
	}
	return nullptr;
}

const IRVarHeader *irsdk_getVarHeaderEntry(int index)
{
	if(isInitialized)
	{
		if(index >= 0 && index < pHeader->numVars)
		{
			return &((IRVarHeader*)(pSharedMem + pHeader->varHeaderOffset))[index];
		}
	}
	return nullptr;
}

// Note: this is a linear search, so cache the results
int irsdk_varNameToIndex(const char *name)
{
	const IRVarHeader *pVar;

	if(name)
	{
		for(int index=0; index<pHeader->numVars; index++)
		{
			pVar = irsdk_getVarHeaderEntry(index);
			if(pVar && 0 == strncmp(name, pVar->name, IRSDK_MAX_STRING))
			{
				return index;
			}
		}
	}

	return -1;
}

int irsdk_varNameToOffset(const char *name)
{
	const IRVarHeader *pVar;

	if(name)
	{
		for(int index=0; index<pHeader->numVars; index++)
		{
			pVar = irsdk_getVarHeaderEntry(index);
			if(pVar && 0 == strncmp(name, pVar->name, IRSDK_MAX_STRING))
			{
				return pVar->offset;
			}
		}
	}

	return -1;
}

unsigned int irsdk_getBroadcastMsgID()
{
	static unsigned int msgId = RegisterWindowMessage(IRSDK_BROADCASTMSGNAME);

	return msgId;
}

void irsdk_broadcastMsg(irsdk_BroadcastMsg msg, int var1, int var2, int var3)
{
	irsdk_broadcastMsg(msg, var1, static_cast<int>(MAKELONG(var2, var3)));
}

void irsdk_broadcastMsg(irsdk_BroadcastMsg msg, int var1, float var2)
{
	// multiply by 2^16-1 to move fractional part to the integer part
	const int real = static_cast<int>(var2 * 65536.0f);

	irsdk_broadcastMsg(msg, var1, real);
}

void irsdk_broadcastMsg(irsdk_BroadcastMsg msg, int var1, int var2)
{
	static unsigned int msgId = irsdk_getBroadcastMsgID();

	if(msgId && msg >= 0 && msg < irsdk_BroadcastLast)
	{
		SendNotifyMessage(HWND_BROADCAST, msgId, MAKELONG(msg, var1), var2);
	}
}

int irsdk_padCarNum(int num, int zero)
{
	int retVal = num;
	int numPlace = 1;
	if(num > 99)
		numPlace = 3;
	else if(num > 9)
		numPlace = 2;
	if(zero)
	{
		numPlace += zero;
		retVal = num + 1000*numPlace;
	}

	return retVal;
}
