//
// Created by jglanz on 1/25/2024.
//

#pragma once

namespace IRacingTools::SDK::Utils {

template<typename T>
struct has_range_support : private T
{
    using T::begin, T::end; /* ... */
};

// template <typename, typename = void>
// struct is_container : std::false_type {};
//
// template <typename T>
// struct is_container<T, std::void_t<
//         typename T::value_type,
//         std::is_convertible<decltype(std::declval<T>().begin() != std::declval<T>().end()), bool>
// >> : std::true_type {};

// Variable template that checks if a type has begin() and end() member functions
template<typename, typename = void>
constexpr bool is_container{};

template<typename T>
constexpr bool is_container<
    T,
    std::void_t<typename T::value_type,
                decltype(std::declval<T>().begin()),
                decltype(std::declval<T>().end())
    >
> = true;

}