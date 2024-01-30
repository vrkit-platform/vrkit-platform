//
// Created by jglanz on 1/26/2024.
//

#pragma once
#include <stdexcept>
#include <fmt/core.h>

namespace IRacingTools::SDK {
class NotImplementedError : public std::logic_error {
public:
    template<typename... T>
    static NotImplementedError create(fmt::format_string<T...> fmt, T &&... args) {
        return NotImplementedError(fmt::format(fmt, args...));
    }

    explicit NotImplementedError(const std::string &msg = "") :
        std::logic_error(msg) {};
};
}
