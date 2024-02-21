//
// Created by jglanz on 1/26/2024.
//

#pragma once
#include <fmt/core.h>
#include <stdexcept>
#include <expected>

namespace IRacingTools::SDK {

enum class ErrorCode : uint32_t { General, NotImplemented, NotFound };

class GeneralError : public std::logic_error {
public:
    template<typename E, typename... T>
    static E create(ErrorCode code, fmt::format_string<T...> fmt, T &&...args) {
        return E(code, fmt::format(fmt, args...));
    }

    explicit GeneralError(ErrorCode code = ErrorCode::General, const std::string &msg = "") :
        std::logic_error(msg), code_(code){};

    explicit GeneralError(const std::string &msg = "") :
        std::logic_error(msg), code_(ErrorCode::General){};

protected:
    ErrorCode code_{ErrorCode::General};
};

class NotImplementedError : public GeneralError {
public:
    explicit NotImplementedError(ErrorCode code = ErrorCode::NotImplemented, const std::string &msg = "") :
        GeneralError(code, msg){};

    explicit NotImplementedError(const std::string &msg = "") :
        GeneralError(ErrorCode::NotImplemented, msg){};
};

template<typename V>
using Expected = std::expected<V, GeneralError>;

template<typename E, typename... T>
auto MakeUnexpected(fmt::format_string<T...> fmt, T &&...args) {
    return std::unexpected<E>(E(fmt::format(fmt, args...)));
}

template<typename E, typename... T>
auto MakeUnexpected(ErrorCode code, fmt::format_string<T...> fmt, T &&...args) {
    return std::unexpected<E>(E(code, fmt::format(fmt, args...)));
};

} // namespace IRacingTools::SDK
