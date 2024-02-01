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

#pragma once

#include "Types.h"
#include "Utils/Singleton.h"

#include <expected>

namespace IRacingTools::SDK {
// A C++ wrapper around the irsdk calls that takes care of the details of maintaining a connection.
// reads out the data into a cache, so you don't have to worry about timing
class LiveClient : public Utils::Singleton<LiveClient> {
public:
    LiveClient() = delete;
    LiveClient(const LiveClient &other) = delete;
    LiveClient(LiveClient &&other) noexcept = delete;
    LiveClient &operator=(const LiveClient &other) = delete;
    LiveClient &operator=(LiveClient &&other) noexcept = delete;

    virtual ~LiveClient() { shutdown(); }


    // wait for live data, or if a .ibt file is open
    // then read the next line from the file.
    bool waitForData(int timeoutMS = 16);

    bool isConnected() const;
    int getStatusId();

    int getVarIdx(const std::string_view &name) const;

    // what is the base type of the data
    // returns VarDataType as int, so we don't depend on IRTypes.h
    VarDataType getVarType(int idx) const;
    VarDataType getVarType(const std::string_view &name);

    // how many elements in array, or 1 if not an array
    int getVarCount(int idx) const;
    int getVarCount(const std::string_view &name);

    // idx is the variables index, entry is the array offset, or 0 if not an array element
    // will convert data to requested type
    bool getVarBool(int idx, int entry = 0);
    bool getVarBool(const std::string_view &name, int entry = 0);

    int getVarInt(int idx, int entry = 0);
    int getVarInt(const std::string_view &name, int entry = 0);

    float getVarFloat(int idx, int entry = 0);
    float getVarFloat(const std::string_view &name, int entry = 0);

    double getVarDouble(int idx, int entry = 0);
    double getVarDouble(const std::string_view &name, int entry = 0);

    //---

    // value that increments with each update to string
    int getSessionCt();

    // has string changed since we last read any values from it
    bool wasSessionStrUpdated();

    // pars string for individual value, 1 success, 0 failure, -n minimum buffer size
    //****Note, this is a linear parser, so it is slow!
    int getSessionStrVal(const std::string_view &path, char *val, int valLen);

    // get the whole string
    std::expected<std::string_view, std::logic_error> getSessionStr();


private:
    explicit LiveClient(token) : data_(nullptr), nData_(0), statusId_(0), lastSessionCt_(-1) {}



    friend Singleton;

    void shutdown();

    char *data_;
    int nData_;
    int statusId_;

    int lastSessionCt_;
};

} // namespace IRacingTools::SDK
