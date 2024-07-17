#pragma once

#include <format>
#include <type_traits>

namespace IRacingTools::SDK::Utils {
  template<std::size_t... I, typename U>
  constexpr auto ToTuple(const U &arr, std::index_sequence<I...>) {
    return std::make_tuple(arr[I]...);
  }

  template<typename T, std::size_t N>
  constexpr auto ToTuple(const T (&arr)[N]) {
    return ToTuple(arr, std::make_index_sequence<N>{});
  }

  template<typename T, std::size_t N>
  constexpr auto ToTuple(const std::array<T, N> &arr) {
    return ToTuple(arr, std::make_index_sequence<N>{});
  }
} // namespace IRacingTools::SDK::Utils
