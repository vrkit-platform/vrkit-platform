#pragma once

#include <type_traits>

namespace IRacingTools::Shared::Utils {

  template <typename, typename = void>
  constexpr bool is_container{};

  template <typename T>
  constexpr bool is_container<T, std::void_t<typename T::value_type, decltype(std::declval<T>().begin()), decltype(
                                               std::declval<T>().end())>> = true;

  template <typename T>
  concept is_resizeable = requires (T a) {
    a.resize(1,0);
  };
}
