#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"
#include "Resources.h"
#include "Types.h"
#include <IRacingTools/SDK/Utils/LUT.h>

namespace IRacingTools::SDK {

// helper class to keep track of our variables index
// Create a global instance of this and it will take care of the details for you.
class VarHolder {
public:
    VarHolder() = delete;
    explicit VarHolder(const std::string_view &name, const std::optional<std::string_view> &clientId = std::nullopt);

    void setVarName(const std::string_view &name);

    // returns VarDataType as int so we don't depend on IRTypes.h
    VarDataType getType();
    uint32_t getCount();
    bool isValid();

    // entry is the array offset, or 0 if not an array element
    bool getBool(int entry = 0);
    int getInt(int entry = 0);
    float getFloat(int entry = 0);
    double getDouble(int entry = 0);

    void setClientId(const std::string_view &clientId);

protected:
    bool reset();
    bool isAvailable();
    Client * getClient();
    static constexpr int kMaxStringLength = Resources::MaxStringLength; //Resources::MaxStringLength


    std::atomic_bool available_{false};
    std::string_view clientId_{""};
    std::string_view name_{""};
    std::string_view unit_{""};
    std::string_view description_{""};
    uint32_t idx_{0};
    ConnectionId connectionId_{0};
};
}