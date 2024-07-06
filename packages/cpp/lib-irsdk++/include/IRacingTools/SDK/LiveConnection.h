
#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include <atomic>
#include <yaml-cpp/yaml.h>


#include "DataHeader.h"
#include "ErrorTypes.h"
#include "Resources.h"
#include "Types.h"
#include "VarData.h"

#include "SessionInfo/ModelParser.h"
#include "Types.h"


#include "Utils/LUT.h"
#include "Utils/Singleton.h"

namespace IRacingTools::SDK {

//----
// Client function definitions
class LiveConnection : public Utils::Singleton<LiveConnection> {
public:


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

    int varNameToIndex(const std::string_view& name);
    int varNameToOffset(const std::string_view& name);

    //send a remote control message to the sim
    // var1, var2, and var3 are all 16 bits signed
    void broadcastMessage(BroadcastMessage msg, int var1, int var2, int var3);
    // var2 can be a full 32 bits
    void broadcastMessage(BroadcastMessage msg, int var1, int var2);
    // var2 can be a full 32 bit float
    void broadcastMessage(BroadcastMessage msg, int var1, float var2);

    // add a leading zero (or zeros) to a car number
    // to encode car #001 call padCarNum(1,2)
    int padCarNumber(int num, int zero);

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

}
