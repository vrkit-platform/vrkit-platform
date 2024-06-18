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

#include <atomic>
#include <filesystem>
#include <memory>
#include <mutex>

#include "Client.h"
#include "DataHeader.h"
#include "DiskSubHeader.h"
#include "Types.h"
#include "Utils/Buffer.h"

// A C++ wrapper around the irsdk calls that takes care of reading a .ibt file
namespace IRacingTools::SDK {
  namespace fs = std::filesystem;

  using VarHeaders = std::vector<VarDataHeader>;


  class DiskClient : public Client, public std::enable_shared_from_this<DiskClient> {
  public:
    DiskClient(const std::filesystem::path &file, const ClientId &clientId);
    DiskClient() = delete;
    DiskClient(const DiskClient &other) = delete;
    DiskClient(DiskClient &&other) noexcept = delete;
    DiskClient &operator=(const DiskClient &other) = delete;
    DiskClient &operator=(DiskClient &&other) noexcept = delete;

    ~DiskClient();

    void close();

    std::shared_ptr<ClientProvider> getProvider() override;

    bool isFileOpen();

    void reset();

    // read next line out of file
    bool next();
    bool hasNext();

    bool seek(std::size_t sampleIndex, bool skipRead = false);

    std::size_t getSampleCount();
    std::size_t getSampleIndex();

    std::optional<fs::path> getFilePath();
    std::size_t getFileSize();

    virtual bool isAvailable() override;

    // return how many variables this .ibt file has in the header
    std::optional<uint32_t> getNumVars() override;

    const VarHeaders &getVarHeaders() override;
    Opt<const VarDataHeader *> getVarHeader(uint32_t idx) override;
    Opt<const VarDataHeader *> getVarHeader(const std::string_view &name) override;

    Opt<const VarDataHeader *> getVarHeader(KnownVarName name) override {
      return Client::getVarHeader(name);
    }

    std::optional<uint32_t> getVarIdx(const std::string_view &name) override;

    std::optional<uint32_t> getVarIdx(KnownVarName name) override {
      return Client::getVarIdx(name);
    }

    // get info on the var
    std::optional<std::string_view> getVarName(uint32_t idx) override;
    std::optional<std::string_view> getVarDesc(uint32_t idx) override;
    std::optional<std::string_view> getVarUnit(uint32_t idx) override;

    // what is the base type of the data
    std::optional<VarDataType> getVarType(uint32_t idx) override;
    std::optional<VarDataType> getVarType(const std::string_view &name) override;

    std::optional<VarDataType> getVarType(KnownVarName name) override {
      return Client::getVarType(name);
    }

    // how many elements in array, or 1 if not an array
    std::optional<uint32_t> getVarCount(uint32_t idx) override;
    std::optional<uint32_t> getVarCount(const std::string_view &name) override;

    std::optional<uint32_t> getVarCount(KnownVarName name) override {
      return Client::getVarCount(name);
    }

    // idx is the variables index, entry is the array offset, or 0 if not an array element
    // will convert data to requested type
    std::optional<bool> getVarBool(uint32_t idx, uint32_t entry = 0) override;
    std::optional<bool> getVarBool(const std::string_view &name, uint32_t entry = 0) override;

    std::optional<bool> getVarBool(KnownVarName name, uint32_t entry = 0) override {
      return Client::getVarBool(name, entry);
    }


    std::optional<int> getVarInt(uint32_t idx, uint32_t entry = 0) override;
    std::optional<int> getVarInt(const std::string_view &name, uint32_t entry = 0) override;

    std::optional<int> getVarInt(KnownVarName name, uint32_t entry = 0) override {
      return Client::getVarInt(name, entry);
    }


    std::optional<float> getVarFloat(uint32_t idx, uint32_t entry = 0) override;
    std::optional<float> getVarFloat(const std::string_view &name, uint32_t entry = 0) override;

    std::optional<float> getVarFloat(KnownVarName name, uint32_t entry = 0) override {
      return Client::getVarFloat(name, entry);
    }

    std::optional<double> getVarDouble(uint32_t idx, uint32_t entry = 0) override;
    std::optional<double> getVarDouble(const std::string_view &name, uint32_t entry = 0) override;

    std::optional<double> getVarDouble(KnownVarName name, uint32_t entry = 0) override {
      return Client::getVarDouble(name, entry);
    }

    // 1 success, 0 failure, -n minimum buffer size
    //int getSessionStrVal(const std::string_view& path, char *val, int valLen) override;

    /**
             * @brief Session update string (yaml)
             *
             * @return string_view or error if unavailable
             */
    Expected<std::string_view> getSessionStr() override;

    virtual std::weak_ptr<SessionInfo::SessionInfoMessage> getSessionInfo() override;

    virtual ClientId getClientId() override;

  protected:
    bool openFile();

    const std::string_view clientId_;
    const fs::path filePath_;

    DataHeader header_{};
    DiskSubHeader diskSubHeader_{};

    std::recursive_mutex ibtFileMutex_{};
    std::size_t fileSize_{};

    std::size_t sampleDataSize_{};
    std::size_t sampleDataOffset_{};
    std::atomic_int64_t sampleIndex_{};

    std::shared_ptr<Utils::DynamicBuffer<char>> sessionInfoBuf_;
    std::shared_ptr<SessionInfo::SessionInfoMessage> sessionInfo_{nullptr};

    std::vector<VarDataHeader> varHeaders_{};
    Utils::DynamicBuffer<char> varBuf_{};
    std::shared_ptr<ClientProvider> clientProvider_{};
    FILE *ibtFile_{nullptr};
  };
}// namespace IRacingTools::SDK
