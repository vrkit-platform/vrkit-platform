//
// Created by jglanz on 1/25/2024.
//

#pragma once

namespace IRacingTools::SDK::Utils {

template<typename, typename = void>
constexpr bool is_container{};

template<typename T>
constexpr bool is_container<
    T,
    std::void_t<
        typename T::value_type,
        decltype(std::declval<T>().begin()),
        decltype(std::declval<T>().end())
    >
> = true;

}