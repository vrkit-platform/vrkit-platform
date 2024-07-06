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

#include "DataHeader.h"
#include "ErrorTypes.h"
#include "Types.h"
#include "Utils/Singleton.h"

#include "Client.h"
#include "Utils/Buffer.h"
#include <mutex>

namespace IRacingTools::SDK {

// A C++ wrapper around the irsdk calls that takes care of the details of maintaining a connection.
// reads out the data into a cache, so you don't have to worry about timing
class LiveClient : public Client, public Utils::Singleton<LiveClient>, public std::enable_shared_from_this<LiveClient> {
public:

    LiveClient() = delete;
    LiveClient(const LiveClient &other) = delete;
    LiveClient(LiveClient &&other) noexcept = delete;
    LiveClient &operator=(const LiveClient &other) = delete;
    LiveClient &operator=(LiveClient &&other) noexcept = delete;

    virtual ~LiveClient() override { shutdown(); }

    std::shared_ptr<ClientProvider> getProvider() override;

    // wait for live data, or if a .ibt file is open
    // then read the next line from the file.
    bool waitForData(int timeoutMS = 16);

    bool isConnected() const;
    virtual ClientId getClientId() override;

    virtual bool isAvailable() override;

    

    // what is the base type of the data
    // returns VarDataType as int, so we don't depend on IRTypes.h
    // return how many variables this .ibt file has in the header
    virtual std::optional<uint32_t> getNumVars() override;

    virtual const VarHeaders &getVarHeaders() override;

    virtual Opt<const VarDataHeader*> getVarHeader(uint32_t idx) override;
    virtual Opt<const VarDataHeader*> getVarHeader(const std::string_view &name) override;

    virtual std::optional<uint32_t> getVarIdx(const std::string_view &name) override;

    // get info on the var
    virtual std::optional<std::string_view> getVarName(uint32_t idx) override;
    virtual std::optional<std::string_view> getVarDesc(uint32_t idx) override;
    virtual std::optional<std::string_view> getVarUnit(uint32_t idx) override;

    // what is the base type of the data
    virtual std::optional<VarDataType> getVarType(uint32_t idx) override;
    virtual std::optional<VarDataType> getVarType(const std::string_view &name) override;

    // how many elements in array, or 1 if not an array
    virtual std::optional<uint32_t> getVarCount(uint32_t idx) override;
    virtual std::optional<uint32_t> getVarCount(const std::string_view &name) override;

    // idx is the variables index, entry is the array offset, or 0 if not an array element
    // will convert data to requested type
    virtual std::optional<bool> getVarBool(uint32_t idx, uint32_t entry) override;
    virtual std::optional<bool> getVarBool(const std::string_view &name, uint32_t entry) override;

    virtual std::optional<int> getVarInt(uint32_t idx, uint32_t entry) override;
    virtual std::optional<int> getVarInt(const std::string_view &name, uint32_t entry) override;

    virtual std::optional<float> getVarFloat(uint32_t idx, uint32_t entry) override;
    virtual std::optional<float> getVarFloat(const std::string_view &name, uint32_t entry) override;

    virtual std::optional<double> getVarDouble(uint32_t idx, uint32_t entry) override;
    virtual std::optional<double> getVarDouble(const std::string_view &name, uint32_t entry) override;

    // 1 success, 0 failure, -n minimum buffer size
//    virtual int getSessionStrVal(const std::string_view &path, char *val, int valLen) override;

    // get the whole string
    // get the whole string
    
    virtual Expected<std::string_view> getSessionInfoStr() override;
    virtual std::optional<WeakSessionInfoWithUpdateCount> getSessionInfoWithUpdateCount() override;
    virtual std::weak_ptr<SessionInfo::SessionInfoMessage> getSessionInfo() override;

    // value that increments with each update to string
    Opt<std::int32_t> getSessionInfoUpdateCount();

    // has string changed since we last read any values from it
    bool wasSessionInfoUpdated();

private:
    explicit LiveClient(token) {}

    friend Singleton;

    void shutdown();

    Expected<bool> updateSessionInfo();
    void onNewClientData();
    void resetSession();

    char *data_ {nullptr};
    int nData_ {0};
    std::int32_t sessionId_{-1};
    std::int32_t sessionSampleCount_{-1};
    std::atomic_flag sessionInfoChangedFlag_{};
    std::recursive_mutex sessionInfoMutex_{};
    
    Opt<std::string_view> sessionInfoStr_{std::nullopt};
    
    SessionInfoWithUpdateCount sessionInfo_{0,nullptr};
    std::shared_ptr<ClientProvider> clientProvider_{};

};

} // namespace IRacingTools::SDK
