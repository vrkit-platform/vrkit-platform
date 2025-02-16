
#pragma once

#include <magic_enum.hpp>

#include <yaml-cpp/yaml.h>

#include <IRacingTools/SDK/DataHeader.h>
#include <IRacingTools/SDK/ErrorTypes.h>
#include <IRacingTools/SDK/Resources.h>
#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/VarData.h>

namespace IRacingTools::SDK {


  /**
   * @class LiveConnection
   * @brief Manages a live connection to iRacing simulator instance.
   *
   * The management of the `LiveConnection`, which encapsulates a running
   * instance of `iRacingSimDX11` & interacts via `memory-mapped` file
   *
   * Key features:
   * - Automatic reconnection handling
   * - Send commands
   * - Read data frames
   * - Access SessionInfo YAML
   * - Management of connection lifecycle
   * - Error detection and recovery mechanisms
   */
  class LiveConnection : public Utils::Singleton<LiveConnection> {

  public:

    /**
     * @inherit
     * @return whether or not the connection is valid & connected
     */
    bool initialize();
    void cleanup();

    bool getNewData(char *data);
    bool waitForDataReady(int timeOut, char *data);
    bool isConnected();

    const DataHeader *getHeader();
    const char *getData(int index);
    const char *getSessionInfoStr();
    std::shared_ptr<SessionInfo::SessionInfoMessage> getSessionInfo();

    uint32_t getSessionUpdateCount(); // incrementing index that indicates new session info string

    const VarDataHeader *getVarHeaderPtr();
    const VarDataHeader *getVarHeaderEntry(uint32_t index);

    std::optional<std::int32_t> getSessionTickCount();

    int varNameToIndex(const std::string_view &name);

    int varNameToOffset(const std::string_view &name);

    void broadcastMessage(BroadcastMessage msg, int var1, int var2, int var3);

    void broadcastMessage(BroadcastMessage msg, int var1, int var2);

    void broadcastMessage(BroadcastMessage msg, int var1, float var2);

    LiveConnection() = delete;
    LiveConnection(const LiveConnection &other) = delete;
    LiveConnection(LiveConnection &&other) noexcept = delete;
    LiveConnection &operator=(const LiveConnection &other) = delete;
    LiveConnection &operator=(LiveConnection &&other) noexcept = delete;

  private:

    friend Singleton;
    explicit LiveConnection(token) {};

    std::shared_ptr<SessionInfo::SessionInfoMessage> sessionInfoMessage_{nullptr};
  };

} // namespace IRacingTools::SDK
