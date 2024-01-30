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

#include <cstdio>
#include <cstring>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/Types.h>
#include <cassert>

#include <IRacingTools/SDK/LiveConnection.h>
#include <magic_enum.hpp>

#include <IRacingTools/SDK/Utils/YamlParser.h>

#pragma warning(disable : 4996)
namespace IRacingTools::SDK {
using namespace Utils;

LiveClient &LiveClient::instance() {
    static LiveClient INSTANCE;
    return INSTANCE;
}

bool LiveClient::waitForData(int timeoutMS) {
    auto& conn = LiveConnection::GetInstance();

    // wait for start of session or new data
    if (conn.irsdk_waitForDataReady(timeoutMS, data_) && conn.irsdk_getHeader()) {
        // if new connection, or data changed lenght then init
        if (!data_ || nData_ != conn.irsdk_getHeader()->bufLen) {
            // allocate memory to hold incoming data from sim
            if (data_)
                delete[] data_;
            nData_ = conn.irsdk_getHeader()->bufLen;
            data_ = new char[nData_];

            // indicate a new connection
            statusId_++;

            // reset session info str status
            lastSessionCt_ = -1;

            // and try to fill in the data
            if (conn.irsdk_getNewData(data_))
                return true;
        } else if (data_) {
            // else we are allready initialized, and data is ready for processing
            return true;
        }
    } else if (!isConnected()) {
        // else session ended
        if (data_)
            delete[] data_;
        data_ = nullptr;

        // reset session info str status
        lastSessionCt_ = -1;
    }

    return false;
}

void LiveClient::shutdown() {
    auto& conn = LiveConnection::GetInstance();
    conn.irsdk_shutdown();

    delete[] data_;
    data_ = nullptr;

    // reset session info str status
    lastSessionCt_ = -1;
}

bool LiveClient::isConnected() const {
    auto& conn = LiveConnection::GetInstance();
    return data_ != nullptr && conn.irsdk_isConnected();
}

int LiveClient::getVarIdx(const char *name) const {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        return conn.irsdk_varNameToIndex(name);
    }

    return -1;
}

int /*VarDataType*/ LiveClient::getVarType(int idx) const {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        if (const VarDataHeader *vh = conn.irsdk_getVarHeaderEntry(idx)) {
            return magic_enum::enum_underlying(vh->type);
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return static_cast<int>(VarDataType::Char);
}

int LiveClient::getVarCount(int idx) const {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        const VarDataHeader *vh = conn.irsdk_getVarHeaderEntry(idx);
        if (vh) {
            return vh->count;
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return 0;
}

bool LiveClient::getVarBool(int idx, int entry) {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        const VarDataHeader *vh = conn.irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case VarDataType::Char:
                    case VarDataType::Bool:
                        return (((const char *)data)[entry]) != 0;
                    break;

                    // 4 bytes
                    case VarDataType::Int32:
                    case VarDataType::Bitmask:
                        return (((const int *)data)[entry]) != 0;
                    break;

                    // test float/double for greater than 1.0 so that
                    // we have a chance of this being usefull
                    // technically there is no right conversion...
                    case VarDataType::Float:
                        return (reinterpret_cast<const float *>(data)[entry]) >= 1.0f;
                    break;

                    // 8 bytes
                    case VarDataType::Double:
                        return (reinterpret_cast<const double *>(data)[entry]) >= 1.0;
                    break;
                }
            } else {
                // invalid offset
                assert(false);
            }
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return false;
}

int LiveClient::getVarInt(int idx, int entry) {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        const VarDataHeader *vh = conn.irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case VarDataType::Char:
                    case VarDataType::Bool:
                        return (int)(((const char *)data)[entry]);
                    break;

                    // 4 bytes
                    case VarDataType::Int32:
                    case VarDataType::Bitmask:
                        return (int)(((const int *)data)[entry]);
                    break;

                    case VarDataType::Float:
                        return static_cast<int>(((const float *) data)[entry]);
                    break;

                    // 8 bytes
                    case VarDataType::Double:
                        return static_cast<int>(((const double *) data)[entry]);
                    break;
                }
            } else {
                // invalid offset
                assert(false);
            }
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return 0;
}

float LiveClient::getVarFloat(int idx, int entry) {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        const VarDataHeader *vh = conn.irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case VarDataType::Char:
                    case VarDataType::Bool:
                        return (float)(((const char *)data)[entry]);
                    break;

                    // 4 bytes
                    case VarDataType::Int32:
                    case VarDataType::Bitmask:
                        return static_cast<float>(((const int *) data)[entry]);
                    break;

                    case VarDataType::Float:
                        return (float)(((const float *)data)[entry]);
                    break;

                    // 8 bytes
                    case VarDataType::Double:
                        return static_cast<float>(((const double *) data)[entry]);
                    break;
                }
            } else {
                // invalid offset
                assert(false);
            }
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return 0.0f;
}

double LiveClient::getVarDouble(int idx, int entry) {
    auto &conn = LiveConnection::GetInstance();
    if (isConnected()) {
        const VarDataHeader *vh = conn.irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case VarDataType::Char:
                    case VarDataType::Bool:
                        return (double) (((const char *) data)[entry]);
                        break;

                    // 4 bytes
                    case VarDataType::Int32:
                    case VarDataType::Bitmask:
                        return (double) (((const int *) data)[entry]);
                        break;

                    case VarDataType::Float:
                        return (double) (((const float *) data)[entry]);
                        break;

                    // 8 bytes
                    case VarDataType::Double:
                        return (double) (((const double *) data)[entry]);
                        break;
                }
            } else {
                // invalid offset
                assert(false);
            }
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return 0.0;
}
int LiveClient::getSessionCt() {
    auto& conn = LiveConnection::GetInstance();
    return conn.irsdk_getSessionInfoStrUpdate();
}

//path is in the form of "DriverInfo:Drivers:CarIdx:{%d}UserName:"
int LiveClient::getSessionStrVal(const char *path, char *val, int valLen) {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected() && path && val && valLen > 0) {
        // track changes in string
        lastSessionCt_ = getSessionCt();

        const char *tVal = nullptr;
        int tValLen = 0;
        if (ParseYaml(conn.irsdk_getSessionInfoStr(), path, &tVal, &tValLen)) {
            // dont overflow out buffer
            int len = tValLen;
            if (len > valLen)
                len = valLen;

            // copy what we can, even if buffer too small
            memcpy(val, tVal, len);
            val[len] = '\0'; // origional string has no null termination...

            // if buffer was big enough, return success
            if (valLen >= tValLen)
                return 1;
            else // return size of buffer needed
                return -tValLen;
        }
    }

    return 0;
}

// get the whole string
const char *LiveClient::getSessionStr() {
    auto& conn = LiveConnection::GetInstance();
    if (isConnected()) {
        lastSessionCt_ = getSessionCt();
        return conn.irsdk_getSessionInfoStr();
    }

    return nullptr;
}


//----------------------------------

VarHolder::VarHolder() : m_idx(-1), m_statusID(-1) {
    m_name[0] = '\0';
}

VarHolder::VarHolder(const char *name) {
    m_name[0] = '\0';
    setVarName(name);
}

void VarHolder::setVarName(const char *name) {
    if (!name || 0 != strncmp(name, m_name, sizeof(m_name))) {
        m_idx = -1;
        m_statusID = -1;

        if (name) {
            strncpy(m_name, name, max_string);
            m_name[max_string - 1] = '\0';
        } else
            m_name[0] = '\0';
    }
}

bool VarHolder::checkIdx() {
    if (LiveClient::instance().isConnected()) {
        if (m_statusID != LiveClient::instance().getStatusID()) {
            m_statusID = LiveClient::instance().getStatusID();
            m_idx = LiveClient::instance().getVarIdx(m_name);
        }

        return true;
    }

    return false;
}

int /*VarDataType*/ VarHolder::getType() {
    if (checkIdx())
        return LiveClient::instance().getVarType(m_idx);
    return 0;
}

int VarHolder::getCount() {
    if (checkIdx())
        return LiveClient::instance().getVarCount(m_idx);
    return 0;
}

bool VarHolder::isValid() {
    checkIdx();
    return (m_idx > -1);
}


bool VarHolder::getBool(int entry) {
    if (checkIdx())
        return LiveClient::instance().getVarBool(m_idx, entry);
    return false;
}

int VarHolder::getInt(int entry) {
    if (checkIdx())
        return LiveClient::instance().getVarInt(m_idx, entry);
    return 0;
}

float VarHolder::getFloat(int entry) {
    if (checkIdx())
        return LiveClient::instance().getVarFloat(m_idx, entry);
    return 0.0f;
}

double VarHolder::getDouble(int entry) {
    if (checkIdx())
        return LiveClient::instance().getVarDouble(m_idx, entry);
    return 0.0;
}
}