#include <cstring>
#include <mutex>

#include <magic_enum.hpp>
#include <spdlog/spdlog.h>
#include <yaml-cpp/yaml.h>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/LogInstance.h>
#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/VarData.h>

#pragma warning(disable : 4996)
namespace IRacingTools::SDK {
  using namespace Utils;

  namespace {
    auto L = GetDefaultLogger();
    /**
     * @brief `ClientProvider` implementation for `LiveClient` implementation
     * 
     */
    struct LiveClientProvider : ClientProvider {
      std::shared_ptr<Client> client;

      explicit LiveClientProvider(std::shared_ptr<Client> client) : client(client) {}

      virtual std::shared_ptr<Client> getClient() override {
        return client;
      }

      virtual ~LiveClientProvider() = default;
    };
  }

  /**
   * @brief Get the data provider for `VarHolder` instances
   * 
   * @return std::shared_ptr<ClientProvider> 
   */
  std::shared_ptr<ClientProvider> LiveClient::getProvider() {
    static std::mutex sProviderMutex{};

    std::scoped_lock lock(sProviderMutex);
    if (!clientProvider_)
      clientProvider_ = std::make_shared<LiveClientProvider>(shared_from_this());

    return clientProvider_;
  }

  /**
   * @brief Calculates whether or not session info & 
   *  other dependencies are properly flagged & updated
   * 
   */
  void LiveClient::onNewClientData() {
    std::scoped_lock lock(sessionInfoMutex_);
    
    // Increment the sample count
    sessionSampleCount_++;
    auto res = updateSessionInfo();
    if (!res.has_value()) {
      L->critical("Unable to updateSessionInfo: {}", res.error().what());
      return;
    }

    auto infoChanged = res.value();
    if (infoChanged) {
      sessionInfoChangedFlag_.test_and_set();
    } else {
      sessionInfoChangedFlag_.clear();
    }
  }

  /**
   * @brief Reset all session/frame/sample trackers
   * 
   */
  void LiveClient::resetSession() {
    std::scoped_lock lock(sessionInfoMutex_);
    sessionInfo_ = {-1,nullptr};
    sessionId_ = -1;
    sessionSampleCount_ = -1;
    sessionInfoChangedFlag_.clear();
  }

  bool LiveClient::waitForData(std::int64_t timeoutMillis) {
    std::scoped_lock lock(sessionInfoMutex_);
    auto &conn = LiveConnection::GetInstance();

    // wait for start of session or new data
    if (conn.waitForDataReady(timeoutMillis, data_) && conn.getHeader()) {
      // if new connection, or data changed lenght then init
      //|| !sessionInfo_.second || sessionInfo_.second->weekendInfo.sessionID != sessionId_
      if (!data_ || nData_ != conn.getHeader()->bufLen) {
        // allocate memory to hold incoming data from sim
        delete[] data_;

        nData_ = conn.getHeader()->bufLen;
        data_ = new char[nData_];

        // reset session info str status
        resetSession();

        // and try to fill in the data
        if (conn.getNewData(data_)){
          onNewClientData();
          return true;
        }
      } else {
        onNewClientData();
        return true;
      }
    } else if (!isConnected()) {
      // else session ended
      if (data_)
        delete[] data_;
      
      data_ = nullptr;

      // reset session info str status
      resetSession();
    }

    return false;
  }

  void LiveClient::shutdown() {
    auto &conn = LiveConnection::GetInstance();
    conn.cleanup();

    delete[] data_;
    data_ = nullptr;

    // reset session info str status
    sessionInfo_.first = -1;
  }

  bool LiveClient::isConnected() const {
    static auto &conn = LiveConnection::GetInstance();
    return data_ != nullptr && conn.isConnected();
    //return conn.isConnected();
  }

  Opt<uint32_t> LiveClient::getVarIdx(const std::string_view &name) {
    static auto &conn = LiveConnection::GetInstance();
    if (isConnected()) {
      return conn.varNameToIndex(name);
    }

    return std::nullopt;
  }

  Opt<const VarDataHeader *> LiveClient::getVarHeader(uint32_t idx) {
    static auto &conn = LiveConnection::GetInstance();
    const VarDataHeader *varHeader;
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

  Opt<std::int32_t> LiveClient::getSessionInfoUpdateCount() {
    std::scoped_lock lock(sessionInfoMutex_);
    if (isConnected()) {
      auto &conn = LiveConnection::GetInstance();
      return conn.getSessionUpdateCount();
    }

    return std::nullopt;
  }

  /**
   * @brief Get session info with the current update count
   * 
   * @return std::optional<Client::WeakSessionInfoWithUpdateCount> 
   */
  std::optional<Client::WeakSessionInfoWithUpdateCount> LiveClient::getSessionInfoWithUpdateCount() {        
      return isAvailable() ? std::make_optional<WeakSessionInfoWithUpdateCount>({sessionInfo_.first, sessionInfo_.second}) : std::nullopt;
  }

  std::weak_ptr<SessionInfo::SessionInfoMessage> LiveClient::getSessionInfo() {
    std::scoped_lock lock(sessionInfoMutex_);
    auto res = updateSessionInfo();
    return res.has_value() && isConnected() && sessionInfo_.second ? sessionInfo_.second : nullptr;
  }

  Expected<bool> LiveClient::updateSessionInfo() {
    std::scoped_lock lock(sessionInfoMutex_);
    auto &conn = LiveConnection::GetInstance();
    auto countOpt = getSessionInfoUpdateCount();
    if (isConnected() && countOpt) {
      auto count = countOpt.value();
      if (!sessionInfoStr_ || sessionInfoStr_.value().empty() || sessionInfo_.first != count) {
        auto data = conn.getSessionInfoStr();
        
        if (data) {          
          sessionInfo_.first = count;
          sessionInfoStr_ = std::make_optional<std::string_view>(data);
          auto rootNode = YAML::Load(data);
          if (!sessionInfo_.second) {
            sessionInfo_.second = std::make_shared<SessionInfo::SessionInfoMessage>();
          }

          SessionInfo::SessionInfoMessage *sessionInfo = sessionInfo_.second.get();
          *sessionInfo = rootNode.as<SessionInfo::SessionInfoMessage>();
          sessionId_ = sessionInfo_.second->weekendInfo.sessionID;
          return true;
        }
      }      
    } 
    // else {
    //   // sessionInfo_ = {-1,nullptr};      
    // }
    return false;
  }

  /**
   * @brief Get the session update string
   *
   * Get a session update string for a given path
   *
   * @return
   */
  Expected<std::string_view> LiveClient::getSessionInfoStr() {
    std::scoped_lock lock(sessionInfoMutex_);
    if (!isConnected())
      return std::unexpected(GeneralError("LiveClient is not connected"));

    auto res = updateSessionInfo();
    if (!res.has_value()) 
      return std::unexpected(res.error());

    if (sessionInfoStr_)
        return sessionInfoStr_.value();

    return MakeUnexpected<GeneralError>("Session Str not found");
  }
  
  /**
   * @brief Check to see if `sessionInfoChangedFlag_` flag is set
   * 
   * @return true when session update count OR session id changes and/or is reset
   * @return false if no session info changes were detected & session remains constant
   */
  bool LiveClient::wasSessionInfoUpdated() {
    std::scoped_lock lock(sessionInfoMutex_);
    return sessionInfoChangedFlag_.test();
  }

  std::int32_t LiveClient::getSampleCount() {
    return sessionSampleCount_;
  }

  std::int32_t LiveClient::getSampleIndex() {
    return sessionSampleCount_;
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

  ClientId LiveClient::getClientId() {
    return LiveClientId;
  }

  std::optional<std::string_view> LiveClient::getVarName(uint32_t idx) {
    if (auto varHeader = getVarHeader(idx)) {
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
    auto varCountOpt = getNumVars();
    if(!varCountOpt || varCountOpt.value() == varHeaders_.size())
      return varHeaders_;

    auto varCount = varCountOpt.value();
    //varHeaders_.resize(varCount);
    for (auto i = 0; i < varCount; i++) {
      auto varHeaderOpt = getVarHeader(i);
      if (!varHeaderOpt)
        continue;

      varHeaders_.push_back(*varHeaderOpt.value());
    }


    return varHeaders_;
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


}// namespace IRacingTools::SDK