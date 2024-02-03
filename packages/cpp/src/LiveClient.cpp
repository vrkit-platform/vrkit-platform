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

#include <cstring>

#include <magic_enum.hpp>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>
#include <IRacingTools/SDK/VarData.h>

#pragma warning(disable : 4996)
namespace IRacingTools::SDK {
using namespace Utils;

bool LiveClient::waitForData(int timeoutMS) {
    auto &conn = LiveConnection::GetInstance();

    // wait for start of session or new data
    if (conn.waitForDataReady(timeoutMS, data_) && conn.getHeader()) {
        // if new connection, or data changed lenght then init
        if (!data_ || nData_ != conn.getHeader()->bufLen) {
            // allocate memory to hold incoming data from sim
            delete[] data_;

            nData_ = conn.getHeader()->bufLen;
            data_ = new char[nData_];

            // indicate a new connection
            connectionId_++;

            // reset session info str status
            previousSessionUpdateCount_ = -1;

            // and try to fill in the data
            if (conn.getNewData(data_))
                return true;
        } else {
            // else we are already initialized, and data is ready for processing
            return true;
        }
    } else if (!isConnected()) {
        // else session ended
        if (data_)
            delete[] data_;
        data_ = nullptr;

        // reset session info str status
        previousSessionUpdateCount_ = -1;
    }

    return false;
}

void LiveClient::shutdown() {
    auto &conn = LiveConnection::GetInstance();
    conn.cleanup();

    delete[] data_;
    data_ = nullptr;

    // reset session info str status
    previousSessionUpdateCount_ = -1;
}

bool LiveClient::isConnected() const {
    auto &conn = LiveConnection::GetInstance();
    return data_ != nullptr && conn.isConnected();
}

Opt<uint32_t> LiveClient::getVarIdx(const std::string_view &name) {
    static auto &conn = LiveConnection::GetInstance();
    if (isConnected()) {
        return conn.varNameToIndex(name);
    }

    return std::nullopt;
}

Opt<const VarDataHeader*> LiveClient::getVarHeader(uint32_t idx) {
    static auto &conn = LiveConnection::GetInstance();
    const VarDataHeader * varHeader;
    if (isConnected() && (varHeader = conn.getVarHeaderEntry(idx))) {
        return varHeader;
    }
    return std::nullopt;
}


Opt<VarDataType> LiveClient::getVarType(uint32_t idx) {
    auto varHeader = getVarHeader(idx);
    if (varHeader) {
        return varHeader.value()->type;
    }

    return std::nullopt;
}

Opt<uint32_t> LiveClient::getVarCount(uint32_t idx) {
    auto &conn = LiveConnection::GetInstance();
    if (isConnected() && isVarIndexOk(idx)) {
        const VarDataHeader *vh = conn.getVarHeaderEntry(idx);
        return vh->count;
    }

    return std::nullopt;
}

Opt<bool> LiveClient::getVarBool(uint32_t idx, uint32_t entry) {
    auto &conn = LiveConnection::GetInstance();
    if (isConnected() && isVarIndexOk(idx, entry)) {
        auto *vh = conn.getVarHeaderEntry(idx);

        const char *data = data_ + vh->offset;
        switch (vh->type) {
            // 1 byte
            case VarDataType::Char:
            case VarDataType::Bool:
                return (((const char *) data)[entry]) != 0;

            // 4 bytes
            case VarDataType::Int32:
            case VarDataType::Bitmask:
                return (((const int *) data)[entry]) != 0;

            // test float/double for greater than 1.0 so that
            // we have a chance of this being usefull
            // technically there is no right conversion...
            case VarDataType::Float:
                return (reinterpret_cast<const float *>(data)[entry]) >= 1.0f;

            // 8 bytes
            case VarDataType::Double:
                return (reinterpret_cast<const double *>(data)[entry]) >= 1.0;
        }
    }

    return std::nullopt;
}

Opt<int> LiveClient::getVarInt(uint32_t idx, uint32_t entry) {
    auto &conn = LiveConnection::GetInstance();
    if (isConnected() && isVarIndexOk(idx, entry)) {
        auto vh = conn.getVarHeaderEntry(idx);

        const char *data = data_ + vh->offset;
        switch (vh->type) {
            // 1 byte
            case VarDataType::Char:
            case VarDataType::Bool:
                return (int) (((const char *) data)[entry]);

            // 4 bytes
            case VarDataType::Int32:
            case VarDataType::Bitmask:
                return (int) (((const int *) data)[entry]);

            case VarDataType::Float:
                return static_cast<int>(((const float *) data)[entry]);

            // 8 bytes
            case VarDataType::Double:
                return static_cast<int>(((const double *) data)[entry]);
        }
    }

    return std::nullopt;
}

Opt<float> LiveClient::getVarFloat(uint32_t idx, uint32_t entry) {
    auto &conn = LiveConnection::GetInstance();
    if (isConnected() && isVarIndexOk(idx, entry)) {
        auto vh = conn.getVarHeaderEntry(idx);

        const char *data = data_ + vh->offset;
        switch (vh->type) {
            // 1 byte
            case VarDataType::Char:
            case VarDataType::Bool:
                return (float) (((const char *) data)[entry]);

            // 4 bytes
            case VarDataType::Int32:
            case VarDataType::Bitmask:
                return static_cast<float>(((const int *) data)[entry]);

            case VarDataType::Float:
                return (float) (((const float *) data)[entry]);

            // 8 bytes
            case VarDataType::Double:
                return static_cast<float>(((const double *) data)[entry]);
        }
    }

    return std::nullopt;
}

Opt<double> LiveClient::getVarDouble(uint32_t idx, uint32_t entry) {
    auto &conn = LiveConnection::GetInstance();
    if (isConnected() && isVarIndexOk(idx, entry)) {
        auto vh = conn.getVarHeaderEntry(idx);

        const char *data = data_ + vh->offset;
        switch (vh->type) {
            // 1 byte
            case VarDataType::Char:
            case VarDataType::Bool:
                return (double) (((const char *) data)[entry]);

            // 4 bytes
            case VarDataType::Int32:
            case VarDataType::Bitmask:
                return (double) (((const int *) data)[entry]);

            case VarDataType::Float:
                return (double) (((const float *) data)[entry]);

            // 8 bytes
            case VarDataType::Double:
                return (double) (((const double *) data)[entry]);
        }
    }

    return std::nullopt;
}

Opt<std::size_t> LiveClient::getSessionUpdateCount() {
    if (isConnected()) {
        auto &conn = LiveConnection::GetInstance();
        return conn.getSessionUpdateCount();
    }

    return std::nullopt;
}

//
/**
 * @brief Get the session update string
 *
 * Get a session update string for a given path
 *
 * @param path string with format "DriverInfo:Drivers:CarIdx:{%d}UserName:"
 * @param val
 * @param valLen
 * @return
 */
int LiveClient::getSessionStrVal(const std::string_view &path, char *val, int valLen) {
    auto &conn = LiveConnection::GetInstance();
    auto sessionUpdateCount = getSessionUpdateCount();
    if (!isConnected() || !sessionUpdateCount || path.empty() || !val || !valLen) {
        return 0;
    }

    // track changes in string
    previousSessionUpdateCount_ = sessionUpdateCount.value();

    const char *tVal = nullptr;
    int tValLen = 0;
    if (ParseYaml(conn.getSessionInfoStr(), path, &tVal, &tValLen)) {
        // dont overflow out buffer
        int len = tValLen;
        if (len > valLen)
            len = valLen;

        // copy what we can, even if buffer too small
        memcpy(val, tVal, len);
        val[len] = '\0'; // original string has no null termination...

        // if buffer was big enough, return success
        if (valLen >= tValLen)
            return 1;
        else // return size of buffer needed
            return -tValLen;
    }

    return 0;
}

// get the whole string
Expected<std::string_view> LiveClient::getSessionStr() {
    auto &conn = LiveConnection::GetInstance();
    auto count = getSessionUpdateCount();
    if (isConnected() && count) {
        previousSessionUpdateCount_ = count.value();
        return conn.getSessionInfoStr();
    }

    return MakeUnexpected<GeneralError>("Session Str not found");
}
bool LiveClient::wasSessionStrUpdated() {
    return previousSessionUpdateCount_ != getSessionUpdateCount();
}
Opt<double> LiveClient::getVarDouble(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res ? getVarDouble(res.value(), entry) : std::nullopt;
}
Opt<float> LiveClient::getVarFloat(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res ? getVarFloat(res.value(), entry) : std::nullopt;
}
Opt<int> LiveClient::getVarInt(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res ? getVarInt(res.value(), entry) : std::nullopt;
}
Opt<bool> LiveClient::getVarBool(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res ? getVarBool(res.value(), entry) : std::nullopt;
}
Opt<uint32_t> LiveClient::getVarCount(const std::string_view &name) {
    auto res = getVarIdx(name);
    return res ? getVarCount(res.value()) : std::nullopt;
}
Opt<VarDataType> LiveClient::getVarType(const std::string_view &name) {
    auto res = getVarIdx(name);
    return res ? getVarType(res.value()) : std::nullopt;
}

ConnectionId LiveClient::getConnectionId() {
    return connectionId_;
}

std::optional<std::string_view> LiveClient::getVarName(uint32_t idx) {
    auto varHeader = getVarHeader(idx);
    if (varHeader) {
        return varHeader.value()->name;
    }
    return std::nullopt;
}
std::optional<std::string_view> LiveClient::getVarDesc(uint32_t idx) {
    auto varHeader = getVarHeader(idx);
    if (varHeader) {
        return varHeader.value()->desc;
    }
    return std::nullopt;
}
std::optional<std::string_view> LiveClient::getVarUnit(uint32_t idx) {
    auto varHeader = getVarHeader(idx);
    if (varHeader) {
        return varHeader.value()->unit;
    }
    return std::nullopt;
}

const VarHeaders &LiveClient::getVarHeaders() {
    static VarHeaders headers{};
    return headers;
}

std::optional<uint32_t> LiveClient::getNumVars() {
    auto &conn = LiveConnection::GetInstance();
    if (conn.isConnected())
        return conn.getHeader()->numVars;

    return std::nullopt;
}
bool LiveClient::isAvailable() {
    return isConnected();
}
Opt<const VarDataHeader *> LiveClient::getVarHeader(const std::string_view &name) {
    auto res = getVarIdx(name);
    return res ? getVarHeader(res.value()) : std::nullopt;
}

} // namespace IRacingTools::SDK