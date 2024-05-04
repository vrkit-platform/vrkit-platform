

#include <cstdio>
#include <cstring>

#include <gsl/util>
#include <yaml-cpp/yaml.h>

#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/FileHelpers.h>
#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <spdlog/spdlog.h>


#pragma warning(disable : 4996)

namespace IRacingTools::SDK {
  using namespace Utils;

  DiskClient::DiskClient(const fs::path &file, const ClientId &clientId)
      : clientId_(clientId), filePath_(file), sessionInfoBuf_(std::make_shared<DynamicBuffer<char>>()) {

    memset(&header_, 0, sizeof(header_));
    memset(&diskSubHeader_, 0, sizeof(diskSubHeader_));

    openFile();
  }

  DiskClient::~DiskClient() {
    reset();

    if (ibtFile_)
      std::fclose(ibtFile_);

    ibtFile_ = nullptr;

    ClientManager::Get().remove(clientId_);
  }


  bool DiskClient::openFile() {
    spdlog::info("Opening IBT file {}", filePath_.string());
    reset();

    if (!fs::exists(filePath_)) {
      throw GeneralError(ErrorCode::NotFound, std::format("{} does not exist", filePath_.string()));
    }

    fileSize_ = fs::file_size(filePath_);
    spdlog::info("IBT file size {}", fileSize_);
    std::FILE *ibtFile = std::fopen(ToUtf8(filePath_).c_str(), "rb");
    if (!ibtFile)
      return false;

    spdlog::info("IBT file opened {}", filePath_.string());
    auto fileDisposer = gsl::finally([&] {
      if (ibtFile) {
        std::fclose(ibtFile);
      }
    });


    if (!FileReadDataFully(&header_, 1, DataHeaderSize, ibtFile)) {
      return false;
    }

    spdlog::info("IBT file read header");

    if (!FileReadDataFully(&diskSubHeader_, 1, DiskSubHeaderSize, ibtFile)) {
      return false;
    }

    spdlog::info("IBT file read disk subheader");
    auto sessionLength = header_.session.len;
    auto sessionOffset = header_.session.offset;
    auto varHeaderOffset = header_.varHeaderOffset;

    sessionInfoBuf_->reset();// = new char[header_.sessionInfo.len];
    if (!sessionInfoBuf_->resize(header_.session.len)) {
      return false;
    }

    spdlog::info("IBT session info buf resized");

    // Read session info
    if (std::fseek(ibtFile, sessionOffset, SEEK_SET)) {
      return false;
    }

    spdlog::info("IBT file about to read session info {} bytes", sessionLength);
    {
      auto data = sessionInfoBuf_->data();
      if (!FileReadDataFully(data, 1, sessionLength, ibtFile)) {
        return false;
      }

      data[sessionLength - 1] = '\0';

      auto rootNode = YAML::Load(data);
      if (!sessionInfo_) {
        sessionInfo_ = std::make_shared<SessionInfo::SessionInfoMessage>();
      }

      SessionInfo::SessionInfoMessage *sessionInfo = sessionInfo_.get();
      *sessionInfo = rootNode.as<SessionInfo::SessionInfoMessage>();
    }

    // Read Headers
    spdlog::info("IBT file parsed session info, seeking header offset {}", varHeaderOffset);
    if (std::fseek(ibtFile, varHeaderOffset, SEEK_SET)) {
      return false;
    }

    varHeaders_.resize(header_.numVars);
    auto varDataHeaderLen = header_.numVars * sizeof(VarDataHeader);
    if (!FileReadDataFully(varHeaders_.data(), 1, varDataHeaderLen, ibtFile)) {
      return false;
    }

    spdlog::info("IBT read headers {}", header_.numVars);

    // Swap file pointer
    ibtFile_ = ibtFile;
    ibtFile = nullptr;

    // Setup var buffer

    sampleIndex_ = 0;
    sampleDataSize_ = header_.bufLen;
    sampleDataOffset_ = header_.varBuf[0].bufOffset;

    varBuf_.resize(sampleDataSize_);
    if (std::fseek(ibtFile_, sampleDataOffset_, SEEK_SET)) {
      return false;
    }
    spdlog::info("IBT disk client ready, sampleDataSize {} bytes", sampleDataSize_);

    return true;

    //delete [] varBuf_;
    //varBuf_ = NULL;

    // delete [] varHeaders_;
    // varHeaders_ = nullptr;
    //

    // delete [] sessionInfoString_;
    // sessionInfoString_ = nullptr;

    //    return false;
  }

  void DiskClient::reset() {
    fileSize_ = 0;
    sampleDataOffset_ = 0;
    sampleIndex_ = 0;

    varHeaders_.clear();
  }

  bool DiskClient::hasNext() {
    return isFileOpen() && sampleIndex_ < getSampleCount();
  }

  bool DiskClient::next() {
    if (hasNext()) {
      varBuf_.reset();
      if (FileReadDataFully(varBuf_.data(), 1, header_.bufLen, ibtFile_)) {
        sampleIndex_++;
        //return std::fread(varBuf_.data(), 1, header_.bufLen, ibtFile_) == static_cast<size_t>(header_.bufLen);
        return true;
      }
    }
    return false;
  }

  // return how many variables this .ibt file has in the header
  std::optional<uint32_t> DiskClient::getNumVars() {
    if (!isFileOpen())
      return std::nullopt;

    return header_.numVars;
  }

  std::optional<uint32_t> DiskClient::getVarIdx(const std::string_view &name) {
    if (isFileOpen() && !name.empty()) {
      for (uint32_t idx = 0; idx < getNumVars(); idx++) {
        if (name == varHeaders_[idx].name) {//0 == strncmp(name, varHeaders_[idx].name, Resources::MaxStringLength)) {
          return idx;
        }
      }
    }

    return std::nullopt;
  }

  Opt<VarDataType> DiskClient::getVarType(uint32_t idx) {
    if (isFileOpen() && isVarIndexOk(idx)) {
      return varHeaders_[idx].type;
    }

    return std::nullopt;
  }

  // get info on the var
  Opt<std::string_view> DiskClient::getVarName(uint32_t idx) {
    if (isFileOpen() && isVarIndexOk(idx)) {
      return varHeaders_[idx].name;
    }

    return std::nullopt;
  }

  Opt<std::string_view> DiskClient::getVarDesc(uint32_t idx) {
    if (isFileOpen() && isVarIndexOk(idx)) {
      return varHeaders_[idx].desc;
    }

    return std::nullopt;
  }

  Opt<std::string_view> DiskClient::getVarUnit(uint32_t idx) {
    if (isFileOpen() && isVarIndexOk(idx)) {
      return varHeaders_[idx].unit;
    }

    return std::nullopt;
  }

  Opt<uint32_t> DiskClient::getVarCount(uint32_t idx) {
    if (isFileOpen() && isVarIndexOk(idx)) {
      return varHeaders_[idx].count;
    }

    return std::nullopt;
  }

  Opt<bool> DiskClient::getVarBool(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char *data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
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
          return (((const float *) data)[entry]) >= 1.0f;

        // 8 bytes
        case VarDataType::Double:
          return (((const double *) data)[entry]) >= 1.0;
      }
    }

    return false;
  }

  Opt<int> DiskClient::getVarInt(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char *data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
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

    return 0;
  }

  Opt<float> DiskClient::getVarFloat(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char *data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
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

    return 0.0f;
  }

  Opt<double> DiskClient::getVarDouble(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char *data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
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

    return 0.0;
  }

  //path is in the form of "DriverInfo:Drivers:CarIdx:{%d}UserName:"
  //int DiskClient::getSessionStrVal(const std::string_view &path, char *val, int valLen) {
  //    if (isFileOpen() && !path.empty() && val && valLen > 0) {
  //        const char *tVal = nullptr;
  //        int tValLen = 0;
  //        if (ParseYaml(sessionInfoBuf_->data(), path, &tVal, &tValLen)) {
  //            // dont overflow out buffer
  //            int len = tValLen;
  //            if (len > valLen)
  //                len = valLen;
  //
  //            // copy what we can, even if buffer too small
  //            memcpy(val, tVal, len);
  //            val[len] = '\0'; // origional string has no null termination...
  //
  //            // if buffer was big enough, return success
  //            if (valLen >= tValLen)
  //                return 1;
  //            else // return size of buffer needed
  //                return -tValLen;
  //        }
  //    }
  //
  //    return 0;
  //}


  bool DiskClient::isFileOpen() {
    return ibtFile_ != nullptr;
  }
  std::size_t DiskClient::getSampleCount() {
    return diskSubHeader_.sampleCount;
  }
  Opt<VarDataType> DiskClient::getVarType(const std::string_view &name) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarType(res.value()) : std::nullopt;
  }

  Opt<uint32_t> DiskClient::getVarCount(const std::string_view &name) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarCount(res.value()) : std::nullopt;
  }
  Opt<bool> DiskClient::getVarBool(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarBool(res.value(), entry) : std::nullopt;
  }

  Opt<int> DiskClient::getVarInt(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarInt(res.value(), entry) : std::nullopt;
  }

  Opt<float> DiskClient::getVarFloat(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarFloat(res.value(), entry) : std::nullopt;
  }

  Opt<double> DiskClient::getVarDouble(const std::string_view &name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarDouble(res.value(), entry) : std::nullopt;
  }

  Expected<std::string_view> DiskClient::getSessionStr() {
    if (!sessionInfoBuf_)
      return MakeUnexpected<GeneralError>("Session str not available");

    return sessionInfoBuf_->data();
  }

  std::size_t DiskClient::getFileSize() {
    return fileSize_;
  }

  std::optional<fs::path> DiskClient::getFilePath() {
    return filePath_;
  }

  const VarHeaders &DiskClient::getVarHeaders() {
    return varHeaders_;
  }
  std::size_t DiskClient::getSampleIndex() {
    return sampleIndex_;
  }

  ClientId DiskClient::getClientId() {
    return clientId_;
  }

  bool DiskClient::isAvailable() {
    return isFileOpen();
  }

  Opt<const VarDataHeader *> DiskClient::getVarHeader(uint32_t idx) {
    if (isAvailable() && isVarIndexOk(idx)) {
      auto &headers = getVarHeaders();
      return &headers[idx];
    }

    return std::nullopt;
  }

  Opt<const VarDataHeader *> DiskClient::getVarHeader(const std::string_view &name) {
    if (isAvailable()) {
      if (auto idx = getVarIdx(name)) {
        return getVarHeader(idx.value());
      }
    }

    return std::nullopt;
  }
  std::weak_ptr<SessionInfo::SessionInfoMessage> DiskClient::getSessionInfo() {
    return sessionInfo_;
  }

}// namespace IRacingTools::SDK
