//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <cstdio>

namespace IRacingTools::SDK::Utils {

bool FileReadDataFully(
    void *buffer, std::size_t size, std::size_t count,
    std::FILE *stream
    ) {
    std::size_t totalRead = 0, read;
    while(totalRead != count && (read = std::fread(buffer,size,count,stream))) {
        totalRead += read;
        if (read == 0) {
            return false;
        }
    }

    return true;

}


}
