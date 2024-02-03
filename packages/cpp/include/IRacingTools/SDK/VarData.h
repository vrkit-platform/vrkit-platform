#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"
#include "Resources.h"
#include "Types.h"
#include <IRacingTools/SDK/Utils/LUT.h>

namespace IRacingTools::SDK {


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

using VarHeaders = std::vector<VarDataHeader>;


}
