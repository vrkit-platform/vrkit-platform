#include <cstdio>
#include <cstring>
#include <ranges>

#include <gsl/util>
#include <yaml-cpp/yaml.h>

#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/LogInstance.h>
#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/FileHelpers.h>
#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/SDK/Utils/Win32.h>
#include <spdlog/spdlog.h>

#pragma warning(disable : 4996)

namespace IRacingTools::SDK {
  using namespace Utils;

  namespace {
    auto L = GetDefaultLogger();

    struct DiskClientProvider : ClientProvider {
      std::shared_ptr<Client> client;

      explicit DiskClientProvider(std::shared_ptr<Client> client) : client(std::move(client)) {
      }

      virtual std::shared_ptr<Client> getClient() override {
        return client;
      }

      virtual ~DiskClientProvider() = default;
    };
  }

  DiskClient::DiskClient(
    const fs::path& file,
    const std::optional<ClientId>& clientId,
    const DiskClient::Extras& extras
  )
    : clientId_(clientId.value_or(file.string())),
      filePath_(file),
      sessionInfoBuf_(std::make_shared<DynamicBuffer<char>>()),
      extras_(extras) {
    memset(&header_, 0, sizeof(header_));
    memset(&diskSubHeader_, 0, sizeof(diskSubHeader_));

    openFile();
  }

  DiskClient::~DiskClient() {
    close();
  }

  std::shared_ptr<DiskClient> DiskClient::CreateForRaceRecording(const std::string& path) {
    std::pair<std::optional<fs::path>, std::optional<fs::path>> rrSrcFiles{std::nullopt, std::nullopt};
    auto files = SDK::Utils::ListAllFiles({path});
    bool valid = false;
    for (auto& f : files) {
      if (fs::is_regular_file(f) && f.filename().string().ends_with("ibt")) {
        std::get<0>(rrSrcFiles) = f;
        valid = true;
      }
      if (fs::is_directory(f) && f.stem().string().starts_with("session-info")) {
        std::get<1>(rrSrcFiles) = f;
      }

      if (valid && std::get<1>(rrSrcFiles)) break;

    }

    if (!valid) return nullptr;

    auto& ibtFile = std::get<0>(rrSrcFiles).value();
    L->info("Using IBT file ({})", ibtFile.string());

    DiskClient::Extras extras{};
    if (rrSrcFiles.second) {
      auto sessionInfoPath = rrSrcFiles.second.value();
      auto sessionInfoFiles = RangeToVector(
        SDK::Utils::ListAllFiles({sessionInfoPath}) | std::views::filter(
          [](auto& f) {
            return f.string().ends_with("yaml");
          }
        )
      );

      for (auto& f : sessionInfoFiles) {
        try {
          L->info("Reading session info file ({})", f.string());

          // GET TICK # FROM FILENAME
          std::regex firstDigitsExp{"^-?(\\d+)"};
          std::smatch m;
          std::string filename = f.filename().string();
          if (!std::regex_search(filename, m, firstDigitsExp)) {
            L->warn("Unable to parse SessionTick from session info file ({})", f.string());
            continue;
          }
          auto tickStr = m[1].str();
          std::int32_t tick = std::stoi(tickStr);
          if (Win32::IsWindowsMagicNumber<std::int32_t>(tick)) {
            L->warn("Ignoring well known MS heap alloc value");
            continue;
          }

          // GET YAML DATA
          auto yamlStrRes = ReadTextFile(f);
          if (!yamlStrRes) {
            L->warn("Unable to read session info file ({})", f.string());
            continue;
          }


          auto& yamlStr = yamlStrRes.value();
          L->debug("Added session info override @ {}tk in ({}) session info overrides", tick, f.string());
          extras.sessionInfoTickQueue.emplace_back(tick, f.string(), yamlStr);
        } catch (std::runtime_error err) {
          L->error("Failed to process session info override file ({}): {}", f.string(), err.what());
        }
      }
    }

    L->debug("Extras includes ({}) session info overrides", extras.sessionInfoTickQueue.size());

    return std::make_shared<DiskClient>(ibtFile, ibtFile.string(), extras);
  }

  void DiskClient::close() {
    reset();

    if (ibtFile_) std::fclose(ibtFile_);

    ibtFile_ = nullptr;

    ClientManager::Get().remove(clientId_);
  }

  std::shared_ptr<ClientProvider> DiskClient::getProvider() {
    static std::mutex sProviderMutex{};

    std::scoped_lock lock(sProviderMutex);
    if (!clientProvider_) clientProvider_ = std::make_shared<DiskClientProvider>(shared_from_this());

    return clientProvider_;
  }


  bool DiskClient::openFile() {

    L->info("Opening IBT file {}", filePath_.string());
    reset();

    if (!fs::exists(filePath_)) {
      throw GeneralError(ErrorCode::NotFound, std::format("{} does not exist", filePath_.string()));
    }

    fileSize_ = fs::file_size(filePath_);
    L->info("IBT file size {}", fileSize_);
    std::FILE* ibtFile = std::fopen(ToUtf8(filePath_).c_str(), "rb");
    if (!ibtFile) return false;

    L->info("IBT file opened {}", filePath_.string());
    auto fileDisposer = gsl::finally(
      [&] {
        if (ibtFile) {
          std::fclose(ibtFile);
        }
      }
    );


    if (!FileReadDataFully(&header_, 1, DataHeaderSize, ibtFile)) {
      return false;
    }

    L->info("IBT file read header");

    if (!FileReadDataFully(&diskSubHeader_, 1, DiskSubHeaderSize, ibtFile)) {
      return false;
    }

    L->info("IBT file read disk session info");
    if (!updateSessionInfo(ibtFile)) {
      return false;
    }
    L->info("IBT file read disk subheader");
    auto varHeaderOffset = header_.varHeaderOffset;

    // Read Headers
    L->info("IBT file parsed session info, seeking header offset {}", varHeaderOffset);
    if (std::fseek(ibtFile, varHeaderOffset, SEEK_SET)) {
      return false;
    }

    varHeaders_.resize(header_.numVars);
    auto varDataHeaderLen = header_.numVars * sizeof(VarDataHeader);
    if (!FileReadDataFully(varHeaders_.data(), 1, varDataHeaderLen, ibtFile)) {
      return false;
    }

    L->info("IBT read headers {}", header_.numVars);

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

    while (next()) {
        auto tickRes = getVarInt(KnownVarName::SessionTick);
        if (tickRes) {
            auto tick = tickRes.value();
            if (!Win32::IsWindowsMagicNumber(tick) && tick >= 0) {
                sampleIndexValidOffset_ = sampleIndex_.load();
                tickSampleIndexOffset_ = tick;
                break;
            }
        }
    }


    sampleIndex_ = sampleIndexValidOffset_;
    if (tickSampleIndexOffset_ == -1 || std::fseek(ibtFile_, sampleDataOffset_ + (header_.bufLen * sampleIndex_), SEEK_SET)) {
      return false;
    }
    L->info("IBT disk client ready, sampleDataSize {} bytes", sampleDataSize_);

    return true;

  }

  std::expected<bool, GeneralError> DiskClient::updateSessionInfo(std::FILE* ibtFile, bool onlyCheckOverrides) {
    if (!ibtFile) {
      ibtFile = ibtFile_;
    }

    if (ibtFile == nullptr) {
      return std::unexpected(GeneralError("IBT file is null"));
    }

    char* data = nullptr;

    if (onlyCheckOverrides && !hasSessionInfoFileOverride()) {
      return false;
    }

    if (hasSessionInfoFileOverride()) {
      std:int32_t tickCount = 0;
      if (!isAvailable()) {
        L->warn("Disk client is not yet ready, using defacto first session info override");
      } else {
        auto tickCountRes = getVarInt("SessionTick");
        if (!tickCountRes) {
          L->error("SessionTick is unavailable");
          return std::unexpected(GeneralError("SessionTick is unavailable"));
        }
        tickCount = tickCountRes.value();
        if (Win32::IsWindowsMagicNumber<std::int32_t>(tickCount)) {
          L->warn("Ignoring well known MS heap alloc value");
          return std::unexpected(GeneralError("SessionTick is a magic number, ignoring"));
        }
      }

      auto sessionInfoOverrideRes = findSessionInfoFileOverride(tickCount);
      if (!sessionInfoOverrideRes) {
        L->warn("Session info override returned no value, but this client has session info overrides or tick is invalid");
        return std::unexpected(
          GeneralError("Session info override returned no value, but this client has session info overrides")
        );
      }

      auto& sessionInfoOverride = sessionInfoOverrideRes.value();
      if (previousSessionInfoOverride_ && std::get<0>(sessionInfoOverride) <= std::get<0>(previousSessionInfoOverride_.value())) {
        L->debug("Session info override is the same as previous, skipping");
        return false;
      }

      previousSessionInfoOverride_ = sessionInfoOverride;

      auto sessionInfoStr = std::get<2>(sessionInfoOverride);
      auto sessionInfoLen = sessionInfoStr.length();

      sessionInfoBuf_->reset();
      if (!sessionInfoBuf_->resize(sessionInfoLen + 1)) {
        return std::unexpected(GeneralError("Unable to resize sessionInfoBuf"));
      }

      L->info("IBT session info buf resized based on override ({}bytes)", sessionInfoLen);
      data = sessionInfoBuf_->data();
      std::memcpy(data, sessionInfoStr.c_str(), sessionInfoLen);
      data[sessionInfoLen] = '\0';

    } else {
      auto sessionLength = header_.session.len;
      auto sessionOffset = header_.session.offset;

      sessionInfoBuf_->reset(); // = new char[header_.sessionInfo.len];
      if (!sessionInfoBuf_->resize(header_.session.len)) {
        return std::unexpected(GeneralError("Unable to resize sessionInfoBuf"));
      }

      L->info("IBT session info buf resized");

      // Read session info
      if (std::fseek(ibtFile, sessionOffset, SEEK_SET)) {
        return false;
      }

      L->info("IBT file about to read session info {} bytes", sessionLength);

      {
        data = sessionInfoBuf_->data();
        if (!FileReadDataFully(data, 1, sessionLength, ibtFile)) {
          return false;
        }

        data[sessionLength - 1] = '\0';
      }
    }
    try {
      auto rootNode = YAML::Load(data);

      if (!sessionInfo_.second) {
        sessionInfo_.second = std::make_shared<SessionInfo::SessionInfoMessage>();
        sessionInfo_.first = 1;
      }

      SessionInfo::SessionInfoMessage* sessionInfo = sessionInfo_.second.get();
      *sessionInfo = rootNode.as<SessionInfo::SessionInfoMessage>();
      return true;
    } catch (const YAML::ParserException& ex) {
      auto msg = std::format("ParserException: Failed to parse session info: {}", ex.what());
      L->error(msg);
      return std::unexpected(SDK::GeneralError(ErrorCode::General, msg));
    } catch (const YAML::Exception& ex) {
      auto msg = std::format("Failed to parse session info: {}", ex.what());
      L->error(msg);
      return std::unexpected(SDK::GeneralError(ErrorCode::General, msg));
    } catch (...) {
      auto msg = std::format("Failed to parse session info: UNKNOWN");
      L->error(msg);
      return std::unexpected(SDK::GeneralError(ErrorCode::General, msg));
    }


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

  bool DiskClient::seek(std::size_t sampleIndex, bool skipRead) {
    std::scoped_lock lock(ibtFileMutex_);
    sampleIndex = std::max<std::int32_t>(
      static_cast<std::int32_t>(sampleIndexValidOffset_),
      static_cast<std::int32_t>(sampleIndex));
    
    if (!isFileOpen() || sampleIndex >= getSampleCount()) return false;

    if (std::fseek(ibtFile_, sampleDataOffset_ + (header_.bufLen * sampleIndex), SEEK_SET)) return false;

    sampleIndex_ = sampleIndex;

    return skipRead || next();
  }

  bool DiskClient::seekToSessionNum(std::int32_t sessionNum) {
    std::scoped_lock lock(ibtFileMutex_);
    while (true) {
      auto sessionNumRes = getVarInt("SessionNum");
      if (!sessionNumRes) {
        L->error("Seek to SessionNum {} failed; SessionNum is invalid or not available", sessionNum);
        return false;
      }

      if (sessionNumRes.value() == sessionNum) {
        L->info("Seek to SessionNum ({}) succeeded at sample index ({})", sessionNum, sampleIndex_.load());
        auto sessionTimeRemainRes = getVarDouble("SessionTimeRemain");
        if (sessionTimeRemainRes) {
          auto sessionTimeRemain = sessionTimeRemainRes.value();
          L->info("SessionTimeRemain={}", sessionTimeRemain);
          if (sessionTimeRemain > 0.0) return true;
        }
      }

      if (!next()) {
        L->error("Seek to SessionNum {} failed; no more records available", sessionNum);
        return false;
      }
    }
    return false;
  }

//  bool DiskClient::current() {
//    std::scoped_lock lock(ibtFileMutex_);
//    if (hasNext()) {
//      varBuf_.reset();
//      if (FileReadDataFully(varBuf_.data(), 1, header_.bufLen, ibtFile_)) {
//        ++sampleIndex_;
//        return true;
//      }
//    }
//    return false;
//  }
//
  bool DiskClient::next(bool readOnly) {
    std::scoped_lock lock(ibtFileMutex_);
    if (hasNext()) {
      varBuf_.reset();
      if (FileReadDataFully(varBuf_.data(), 1, header_.bufLen, ibtFile_)) {
        if (!readOnly)
          ++sampleIndex_;
        return true;
      }
    }
    return false;
  }

  // return how many variables this .ibt file has in the header
  std::optional<uint32_t> DiskClient::getNumVars() {
    if (!isFileOpen()) return std::nullopt;

    return header_.numVars;
  }

  std::optional<uint32_t> DiskClient::getVarIdx(const std::string_view& name) {
    if (isFileOpen() && !name.empty()) {
      for (uint32_t idx = 0; idx < getNumVars(); idx++) {
        if (std::strcmp(name.data(), varHeaders_[idx].name) == 0) {

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
      const char* data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
      // 1 byte
      case VarDataType::Char:
      case VarDataType::Bool:
        return (((const char*)data)[entry]) != 0;

      // 4 bytes
      case VarDataType::Int32:
      case VarDataType::Bitmask:
        return (reinterpret_cast<const int*>(data)[entry]) != 0;

      // test float/double for greater than 1.0 so that
      // we have a chance of this being usefull
      // technically there is no right conversion...
      case VarDataType::Float:
        return (reinterpret_cast<const float*>(data)[entry]) >= 1.0f;

      // 8 bytes
      case VarDataType::Double:
        return (reinterpret_cast<const double*>(data)[entry]) >= 1.0;
      }
    }

    return false;
  }

  Opt<int> DiskClient::getVarInt(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char* data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
      // 1 byte
      case VarDataType::Char:
      case VarDataType::Bool:
        return (int)(((const char*)data)[entry]);

      // 4 bytes
      case VarDataType::Int32:
      case VarDataType::Bitmask:
        return (int)(((const int*)data)[entry]);

      case VarDataType::Float:
        return static_cast<int>(((const float*)data)[entry]);

      // 8 bytes
      case VarDataType::Double:
        return static_cast<int>(((const double*)data)[entry]);
      }
    }

    return 0;
  }

  Opt<float> DiskClient::getVarFloat(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char* data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
      // 1 byte
      case VarDataType::Char:
      case VarDataType::Bool:
        return (float)(((const char*)data)[entry]);

      // 4 bytes
      case VarDataType::Int32:
      case VarDataType::Bitmask:
        return static_cast<float>(((const int*)data)[entry]);

      case VarDataType::Float:
        return (float)(((const float*)data)[entry]);

      // 8 bytes
      case VarDataType::Double:
        return static_cast<float>(((const double*)data)[entry]);
      }
    }

    return 0.0f;
  }

  Opt<double> DiskClient::getVarDouble(uint32_t idx, uint32_t entry) {
    if (isFileOpen() && isVarIndexOk(idx, entry)) {
      const char* data = varBuf_.data() + varHeaders_[idx].offset;
      switch (varHeaders_[idx].type) {
      // 1 byte
      case VarDataType::Char:
      case VarDataType::Bool:
        return (double)(((const char*)data)[entry]);

      // 4 bytes
      case VarDataType::Int32:
      case VarDataType::Bitmask:
        return (double)(((const int*)data)[entry]);

      case VarDataType::Float:
        return (double)(((const float*)data)[entry]);

      // 8 bytes
      case VarDataType::Double:
        return (double)(((const double*)data)[entry]);
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

  std::size_t DiskClient::getSampleIndex() {
    return sampleIndex_;
  }

  Opt<VarDataType> DiskClient::getVarType(const std::string_view& name) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarType(res.value()) : std::nullopt;
  }

  Opt<uint32_t> DiskClient::getVarCount(const std::string_view& name) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarCount(res.value()) : std::nullopt;
  }

  Opt<bool> DiskClient::getVarBool(const std::string_view& name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarBool(res.value(), entry) : std::nullopt;
  }

  Opt<int> DiskClient::getVarInt(const std::string_view& name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarInt(res.value(), entry) : std::nullopt;
  }

  Opt<float> DiskClient::getVarFloat(const std::string_view& name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarFloat(res.value(), entry) : std::nullopt;
  }

  Opt<double> DiskClient::getVarDouble(const std::string_view& name, uint32_t entry) {
    auto res = getVarIdx(name);
    return res.has_value() ? getVarDouble(res.value(), entry) : std::nullopt;
  }

  Opt<std::int32_t> DiskClient::getSessionInfoUpdateCount() {
    return header_.session.count;
  }

  std::optional<std::int32_t> DiskClient::getSessionTicks() {
    return getVarInt(KnownVarName::SessionTick);
  }

  std::optional<std::int32_t> DiskClient::getSessionTickCount() {
    return static_cast<std::int32_t>(getSampleCount()) + getSessionTickSampleOffset();
  }

  std::int32_t DiskClient::getSessionTickSampleOffset() {
    return tickSampleIndexOffset_;
  }

  Expected<std::string_view> DiskClient::getSessionInfoStr() {
    if (!sessionInfoBuf_) return MakeUnexpected<GeneralError>("Session str not available");

    return sessionInfoBuf_->data();
  }

  std::size_t DiskClient::getFileSize() {
    return fileSize_;
  }

  std::optional<fs::path> DiskClient::getFilePath() {
    return filePath_;
  }

  const VarHeaders& DiskClient::getVarHeaders() {
    return varHeaders_;
  }


  ClientId DiskClient::getClientId() {
    return clientId_;
  }

  bool DiskClient::copyDataVariableBuffer(void* target, std::size_t size) {
    std::scoped_lock lock(ibtFileMutex_);
    if (!isAvailable()) {
      L->error("cannot copy data variable buffer from a closed DiskClient");
      return false;
    }

    if (size != varBuf_.size()) {
      L->error("data variable buffer size mismatch (varBufSize={},targetSize={})", varBuf_.size(), size);
      return false;
    }

    std::memcpy(target, varBuf_.data(), size);
    return true;

    return false;
  }

  bool DiskClient::hasSessionInfoFileOverride() {
    return !extras_.sessionInfoTickQueue.empty();
  }


  std::optional<DiskClient::SessionInfoFileOverride> DiskClient::findSessionInfoFileOverride(std::uint32_t tickCount) {
    if (!hasSessionInfoFileOverride()) return std::nullopt;

    if (Win32::IsWindowsMagicNumber<std::int32_t>(tickCount)) {
      L->warn("Ignoring well known MS heap alloc value");
      return std::nullopt;
    }

    std::optional<SessionInfoFileOverride> currentOverride{std::nullopt};
    for (auto& nextOverride : extras_.sessionInfoTickQueue) {
      auto nextTickCount = std::get<0>(nextOverride);
      if (!currentOverride || (std::get<0>(currentOverride.value()) <= nextTickCount && nextTickCount <= tickCount)) {
        currentOverride = std::make_optional<SessionInfoFileOverride>(nextOverride);
      }
    }

    return currentOverride.value_or(extras_.sessionInfoTickQueue[0]);
  }

  bool DiskClient::isAvailable() {
    return isFileOpen();
  }

  Opt<const VarDataHeader*> DiskClient::getVarHeader(uint32_t idx) {
    if (isAvailable() && isVarIndexOk(idx)) {
      auto& headers = getVarHeaders();
      return &headers[idx];
    }

    return std::nullopt;
  }

  Opt<const VarDataHeader*> DiskClient::getVarHeader(const std::string_view& name) {
    if (isAvailable()) {
      if (auto idx = getVarIdx(name)) {
        return getVarHeader(idx.value());
      }
    }

    return std::nullopt;
  }

  std::weak_ptr<SessionInfo::SessionInfoMessage> DiskClient::getSessionInfo() {
    return sessionInfo_.second;
  }

  std::optional<Client::WeakSessionInfoWithUpdateCount> DiskClient::getSessionInfoWithUpdateCount() {
    return isAvailable() ?
             std::make_optional<WeakSessionInfoWithUpdateCount>({sessionInfo_.first, sessionInfo_.second}) :
             std::nullopt;
  }

} // namespace IRacingTools::SDK
