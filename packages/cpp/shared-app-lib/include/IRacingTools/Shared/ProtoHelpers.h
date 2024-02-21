//
// Created by jglanz on 1/17/2024.
//

#pragma once

#include "FileSystemHelpers.h"
#include "Macros.h"

namespace IRacingTools::Shared {
    template<typename MessageClazz>
    std::optional<MessageClazz> ReadMessageFromFile(const fs::path& path) {
        auto data = ReadFile(path);
        if (data.empty()) {
            return std::nullopt;
        };

        MessageClazz msg;
        msg.ParseFromArray(data.data(), data.size());
        return std::make_optional(std::move(msg));
    };
}