#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"
#include "Resources.h"
#include "Types.h"
#include "VarData.h"

namespace IRacingTools::SDK {


struct DataHeader {
    struct SessionDetails {
        uint32_t count{};
        uint32_t len{};
        uint32_t offset{};
    };

    Resources::VersionType ver{};      // this api header version, see Resources::Version
    ConnectionStatus status{};   // bitfield using IRStatusField
    int tickRate{}; // ticks per second (60 or 360 etc)

    // session information, updated periodically
    // TODO: moved the 3 below fields into struct, if everything works,
    //  remove the commented out block
    SessionDetails session{};

    // int sessionInfoUpdate; // Incremented when session info changes
    // int sessionInfoLen;    // Length in bytes of session info string
    // int sessionInfoOffset; // Session info, encoded in YAML format

    // State data, output at tickRate

    int numVars{};         // length of array pointed to by varHeaderOffset
    int varHeaderOffset{}; // offset to VarDataHeader[numVars] array, Describes the variables received in varBuf

    int numBuf{};                                     // <= Resources::MaxBufferCount (3 for now)
    int bufLen{};                                     // length in bytes for one line

    int ignoreMemberUnused[2];                                    // (16 byte align)

    VarDataBufDescriptor varBuf[Resources::MaxBufferCount]{}; // buffers of data being written to
};

constexpr auto DataHeaderSize = sizeof(DataHeader);

}
