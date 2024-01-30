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


/*
 The IRSDK is a simple api that lets clients access telemetry data from the 
 iRacing simulator. It is broken down into several parts:

 - Live data
   Live data is output from the sim into a shared memory mapped file.  Any
   application can open this memory mapped file and read the telemetry data
   out.  The format of this data was laid out in such a way that it should be
   possible to access from any language that can open a windows memory mapped
   file, without needing an external api.

   There are two different types of data that the telemetry outputs,
   sessionInfo and variables: 
   
   Session info is for data that only needs to be updated every once in a
   while.  This data is output as a YAML formatted string.

   Variables, on the other hand, are output at a rate of 60 times a second.
   The varHeader struct defines each variable that the sim will output, while
   the varData struct gives details about the current line buffer that the vars
   are being written into.  Each variable is packed into a binary array with 
   an offset and length stored in the varHeader.  The number of variables 
   available can change depending on the car or session loaded.  But once the
   sim is running the variable list is locked down and will not change during a
   session.

   The sim writes a new line of variables every 16 ms, and then signals any
   listeners in order to wake them up to read the data.  Because the sim has no
   way of knowing when a listener is done reading the data, we triple buffer
   it in order to give all the clients enough time to read the data out.  This
   gives you a minimum of 16 ms to read the data out and process it.  So it is
   best to copy the data out before processing it.  You can use the function
   irsdk_waitForDataReady() to both wait for new data and copy the data to a
   local buffer.

 - Logged data
   Detailed information about the local drivers car can be logged to disk in
   the form of an ibt binary file.  This logging is enabled in the sim by
   typing alt-L at any time.  The ibt file format directly mirrors the format
   of the live data.

   It is stored as an DataHeader followed immediately by an DiskSubHeader.
   After that the offsets in the DataHeader point to the sessionInfo string,
   the varHeader, and the varBuffer.

 - Remote Conrol
   You can control the camera selections and playback of a replay tape, from
   any external application by sending a windows message with the 
   irsdk_broadcastMsg() function.
*/
#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"
#include "Resources.h"
#include "Types.h"

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>

namespace IRacingTools::SDK {

//----
// Client function definitions
class LiveConnection : public Utils::Singleton<LiveConnection> {
public:


    bool irsdk_startup();
    void irsdk_shutdown();

    bool irsdk_getNewData(char *data);
    bool irsdk_waitForDataReady(int timeOut, char *data);
    bool irsdk_isConnected();

    const DataHeader *irsdk_getHeader();
    const char *irsdk_getData(int index);
    const char *irsdk_getSessionInfoStr();
    uint32_t irsdk_getSessionInfoStrUpdate(); // incrementing index that indicates new session info string

    const VarDataHeader *irsdk_getVarHeaderPtr();
    const VarDataHeader *irsdk_getVarHeaderEntry(int index);

    int irsdk_varNameToIndex(const char *name);
    int irsdk_varNameToOffset(const char *name);

    //send a remote controll message to the sim
    // var1, var2, and var3 are all 16 bits signed
    void irsdk_broadcastMsg(BroadcastMessage msg, int var1, int var2, int var3);
    // var2 can be a full 32 bits
    void irsdk_broadcastMsg(BroadcastMessage msg, int var1, int var2);
    // var2 can be a full 32 bit float
    void irsdk_broadcastMsg(BroadcastMessage msg, int var1, float var2);

    // add a leading zero (or zeros) to a car number
    // to encode car #001 call padCarNum(1,2)
    int irsdk_padCarNum(int num, int zero);

    LiveConnection() = delete;
    LiveConnection(const LiveConnection &other) = delete;
    LiveConnection(LiveConnection &&other) noexcept = delete;
    LiveConnection &operator=(const LiveConnection &other) = delete;
    LiveConnection &operator=(LiveConnection &&other) noexcept = delete;

private:
    friend Singleton;
    explicit LiveConnection(token) {};
};

}
