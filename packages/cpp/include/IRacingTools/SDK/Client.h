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

#include <expected>
#include <filesystem>

#include "DataHeader.h"
#include "DiskSubHeader.h"
#include "ErrorTypes.h"
#include "Types.h"
#include "Utils/Buffer.h"

// A C++ wrapper around the irsdk calls that takes care of reading a .ibt file
namespace IRacingTools::SDK {
namespace fs = std::filesystem;


class Client {
public:


    virtual ~Client() = default;
    virtual bool isAvailable() = 0;
    virtual ConnectionId getConnectionId() = 0;
    /**
     * @brief Is index valid based on total number of vars
     * @param idx
     * @return
     */
    inline bool isVarIndexOk(uint32_t idx, std::optional<uint32_t> entry = std::nullopt) {
        return idx < getNumVars() && (!entry.has_value() || entry.value() < getVarCount(idx));
    }

    // return how many variables this .ibt file has in the header
    virtual std::optional<uint32_t> getNumVars() = 0;

    virtual const VarHeaders& getVarHeaders() = 0;

    virtual Opt<const VarDataHeader*> getVarHeader(uint32_t idx) = 0;
    virtual Opt<const VarDataHeader*> getVarHeader(const std::string_view &name) = 0;

    virtual std::optional<uint32_t> getVarIdx(const std::string_view &name) = 0;

    // get info on the var
    virtual std::optional<std::string_view> getVarName(uint32_t idx) = 0;
    virtual std::optional<std::string_view> getVarDesc(uint32_t idx) = 0;
    virtual std::optional<std::string_view> getVarUnit(uint32_t idx) = 0;

    // what is the base type of the data
    virtual std::optional<VarDataType> getVarType(uint32_t idx) = 0;
    virtual std::optional<VarDataType> getVarType(const std::string_view &name) = 0;

    // how many elements in array, or 1 if not an array
    virtual std::optional<uint32_t> getVarCount(uint32_t idx) = 0;
    virtual std::optional<uint32_t> getVarCount(const std::string_view &name) = 0;

    // idx is the variables index, entry is the array offset, or 0 if not an array element
    // will convert data to requested type
    virtual std::optional<bool> getVarBool(uint32_t idx, uint32_t entry = 0) = 0;
    virtual std::optional<bool> getVarBool(const std::string_view &name, uint32_t entry = 0) = 0;

    virtual std::optional<int> getVarInt(uint32_t idx, uint32_t entry = 0) = 0;
    virtual std::optional<int> getVarInt(const std::string_view &name, uint32_t entry = 0) = 0;

    virtual std::optional<float> getVarFloat(uint32_t idx, uint32_t entry = 0) = 0;
    virtual std::optional<float> getVarFloat(const std::string_view &name, uint32_t entry = 0) = 0;

    virtual std::optional<double> getVarDouble(uint32_t idx, uint32_t entry = 0) = 0;
    virtual std::optional<double> getVarDouble(const std::string_view &name, uint32_t entry = 0) = 0;

    // 1 success, 0 failure, -n minimum buffer size
    virtual Expected<std::string_view> getSessionStr() = 0;
    virtual int getSessionStrVal(const std::string_view &path, char *val, int valLen) = 0;

    // get the whole string
//    virtual const char *getSessionStr() = 0;



};


  struct ClientProvider {

    virtual std::shared_ptr<Client> getClient() = 0;
  };

} // namespace IRacingTools::SDK
