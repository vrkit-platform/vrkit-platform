//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <algorithm>
#include <string>


namespace IRacingTools::SDK::Utils::Strings {
    constexpr std::string toLowerCase(std::string s) {
        std::ranges::transform(
            s,
            s.begin(),
            [](unsigned char c) { return std::tolower(c); } // correct
        );
        return s;
    }
}
