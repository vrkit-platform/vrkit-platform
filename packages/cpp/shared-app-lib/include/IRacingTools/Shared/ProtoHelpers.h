//
// Created by jglanz on 1/17/2024.
//

#pragma once

#include <IRacingTools/SDK/Utils/FileHelpers.h>
#include "Macros.h"

#define IRT_PROTO_CMP(O1, O2, MEMBER) O1.MEMBER() == O2.MEMBER()

namespace IRacingTools::Shared {
    template<typename MessageClazz>
    std::optional<MessageClazz> ReadMessageFromFile(const std::filesystem::path& path) {
        auto res = SDK::Utils::ReadFile(path);
        if (!res.has_value()) {
            return std::nullopt;
        }

        auto data = res.value();
        if (data.empty()) {
            return std::nullopt;
        };

        MessageClazz msg;
        msg.ParseFromArray(data.data(), data.size());
        return std::make_optional(std::move(msg));
    };
}