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
class VarHolder
{
public:
    VarHolder();
    explicit VarHolder(const std::string_view& name);

    void setVarName(const std::string_view& name);

    // returns VarDataType as int so we don't depend on IRTypes.h
    VarDataType getType();
    int getCount();
    bool isValid();

    // entry is the array offset, or 0 if not an array element
    bool getBool(int entry = 0);
    int getInt(int entry = 0);
    float getFloat(int entry = 0);
    double getDouble(int entry = 0);

protected:
    bool checkIdx();

    static const int max_string = 32; //Resources::MaxStringLength
    std::string_view name_{""};
    int idx_;
    int statusId_;
};

struct VarDataHeader {
    /**
     * @brief Data Type
     */
    VarDataType type;

    /**
     * @brief Offset in buffer from start of row
     */
    int offset;
    /**
     * @brief Number of entries
     */
    int count;

    // so length in bytes would be VarDataTypeBytes[type] * count
    bool countAsTime;
    char pad[3]; // (16 byte align)

    char name[Resources::MaxStringLength];
    char desc[Resources::MaxDescriptionLength];
    char unit[Resources::MaxStringLength]; // something like "kg/m^2"

    void clear() {
        type = VarDataType::Char;
        offset = 0;
        count = 0;
        countAsTime = false;
        memset(name, 0, sizeof(name));
        memset(desc, 0, sizeof(name));
        memset(unit, 0, sizeof(name));
    }
};

struct VarDataBufDescriptor {
    int tickCount; // used to detect changes in data
    int bufOffset; // offset from header
    int pad[2];    // (16 byte align)
};


}
