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

#include <cassert>
#include <IRacingTools/SDK/Client.h>
#include <IRacingTools/SDK/Types.h>

#include <magic_enum.hpp>

#include "YamlParser.h"

#pragma warning(disable : 4996)
namespace IRacingTools::SDK {
IRClient &IRClient::instance() {
    static IRClient INSTANCE;
    return INSTANCE;
}

bool IRClient::waitForData(int timeoutMS) {
    // wait for start of session or new data
    if (irsdk_waitForDataReady(timeoutMS, data_) && irsdk_getHeader()) {
        // if new connection, or data changed lenght then init
        if (!data_ || nData_ != irsdk_getHeader()->bufLen) {
            // allocate memory to hold incoming data from sim
            if (data_)
                delete[] data_;
            nData_ = irsdk_getHeader()->bufLen;
            data_ = new char[nData_];

            // indicate a new connection
            statusId_++;

            // reset session info str status
            lastSessionCt_ = -1;

            // and try to fill in the data
            if (irsdk_getNewData(data_))
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

void IRClient::shutdown() {
    irsdk_shutdown();

    delete[] data_;
    data_ = nullptr;

    // reset session info str status
    lastSessionCt_ = -1;
}

bool IRClient::isConnected() const {
    return data_ != nullptr && irsdk_isConnected();
}

int IRClient::getVarIdx(const char *name) const {
    if (isConnected()) {
        return irsdk_varNameToIndex(name);
    }

    return -1;
}

int /*IRVarType*/ IRClient::getVarType(int idx) const {
    if (isConnected()) {
        if (const IRVarHeader *vh = irsdk_getVarHeaderEntry(idx)) {
            return magic_enum::enum_underlying(vh->type);
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return static_cast<int>(IRVarType::type_char);
}

int IRClient::getVarCount(int idx) const {
    if (isConnected()) {
        const IRVarHeader *vh = irsdk_getVarHeaderEntry(idx);
        if (vh) {
            return vh->count;
        } else {
            //invalid variable index
            assert(false);
        }
    }

    return 0;
}

bool IRClient::getVarBool(int idx, int entry) {
    if (isConnected()) {
        const IRVarHeader *vh = irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case IRVarType::type_char:
                    case IRVarType::type_bool:
                        return (((const char *)data)[entry]) != 0;
                    break;

                    // 4 bytes
                    case IRVarType::type_int:
                    case IRVarType::type_bitmask:
                        return (((const int *)data)[entry]) != 0;
                    break;

                    // test float/double for greater than 1.0 so that
                    // we have a chance of this being usefull
                    // technically there is no right conversion...
                    case IRVarType::type_float:
                        return (reinterpret_cast<const float *>(data)[entry]) >= 1.0f;
                    break;

                    // 8 bytes
                    case IRVarType::type_double:
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

int IRClient::getVarInt(int idx, int entry) {
    if (isConnected()) {
        const IRVarHeader *vh = irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case IRVarType::type_char:
                    case IRVarType::type_bool:
                        return (int)(((const char *)data)[entry]);
                    break;

                    // 4 bytes
                    case IRVarType::type_int:
                    case IRVarType::type_bitmask:
                        return (int)(((const int *)data)[entry]);
                    break;

                    case IRVarType::type_float:
                        return static_cast<int>(((const float *) data)[entry]);
                    break;

                    // 8 bytes
                    case IRVarType::type_double:
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

float IRClient::getVarFloat(int idx, int entry) {
    if (isConnected()) {
        const IRVarHeader *vh = irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case IRVarType::type_char:
                    case IRVarType::type_bool:
                        return (float)(((const char *)data)[entry]);
                    break;

                    // 4 bytes
                    case IRVarType::type_int:
                    case IRVarType::type_bitmask:
                        return static_cast<float>(((const int *) data)[entry]);
                    break;

                    case IRVarType::type_float:
                        return (float)(((const float *)data)[entry]);
                    break;

                    // 8 bytes
                    case IRVarType::type_double:
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

double IRClient::getVarDouble(int idx, int entry) {
    if (isConnected()) {
        const IRVarHeader *vh = irsdk_getVarHeaderEntry(idx);
        if (vh) {
            if (entry >= 0 && entry < vh->count) {
                const char *data = data_ + vh->offset;
                switch (vh->type) {
                    // 1 byte
                    case IRVarType::type_char:
                    case IRVarType::type_bool:
                        return (double)(((const char *)data)[entry]);
                    break;

                    // 4 bytes
                    case IRVarType::type_int:
                    case IRVarType::type_bitmask:
                        return (double)(((const int *)data)[entry]);
                    break;

                    case IRVarType::type_float:
                        return (double)(((const float *)data)[entry]);
                    break;

                    // 8 bytes
                    case IRVarType::type_double:
                        return (double)(((const double *)data)[entry]);
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

//path is in the form of "DriverInfo:Drivers:CarIdx:{%d}UserName:"
int IRClient::getSessionStrVal(const char *path, char *val, int valLen) {
    if (isConnected() && path && val && valLen > 0) {
        // track changes in string
        lastSessionCt_ = getSessionCt();

        const char *tVal = nullptr;
        int tValLen = 0;
        if (parseYaml(irsdk_getSessionInfoStr(), path, &tVal, &tValLen)) {
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
const char *IRClient::getSessionStr() {
    if (isConnected()) {
        lastSessionCt_ = getSessionCt();
        return irsdk_getSessionInfoStr();
    }

    return nullptr;
}


//----------------------------------

IRVarHolder::IRVarHolder() : m_idx(-1), m_statusID(-1) {
    m_name[0] = '\0';
}

IRVarHolder::IRVarHolder(const char *name) {
    m_name[0] = '\0';
    setVarName(name);
}

void IRVarHolder::setVarName(const char *name) {
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

bool IRVarHolder::checkIdx() {
    if (IRClient::instance().isConnected()) {
        if (m_statusID != IRClient::instance().getStatusID()) {
            m_statusID = IRClient::instance().getStatusID();
            m_idx = IRClient::instance().getVarIdx(m_name);
        }

        return true;
    }

    return false;
}

int /*IRVarType*/ IRVarHolder::getType() {
    if (checkIdx())
        return IRClient::instance().getVarType(m_idx);
    return 0;
}

int IRVarHolder::getCount() {
    if (checkIdx())
        return IRClient::instance().getVarCount(m_idx);
    return 0;
}

bool IRVarHolder::isValid() {
    checkIdx();
    return (m_idx > -1);
}


bool IRVarHolder::getBool(int entry) {
    if (checkIdx())
        return IRClient::instance().getVarBool(m_idx, entry);
    return false;
}

int IRVarHolder::getInt(int entry) {
    if (checkIdx())
        return IRClient::instance().getVarInt(m_idx, entry);
    return 0;
}

float IRVarHolder::getFloat(int entry) {
    if (checkIdx())
        return IRClient::instance().getVarFloat(m_idx, entry);
    return 0.0f;
}

double IRVarHolder::getDouble(int entry) {
    if (checkIdx())
        return IRClient::instance().getVarDouble(m_idx, entry);
    return 0.0;
}
}