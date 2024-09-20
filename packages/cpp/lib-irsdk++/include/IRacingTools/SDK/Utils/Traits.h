//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <format>
#include <string>

#include <boost/type_index.hpp>


namespace IRacingTools::SDK::Utils {

template<typename T>
  struct PrettyType {
    std::string name() {
      // std::string_view prettyName = boost::typeindex::type_id_with_cvr<T>().pretty_name();
      auto& info = boost::typeindex::type_id_with_cvr<T>().type_info();
      auto id = boost::typeindex::type_id_with_cvr<T>();
      std::string prettyName = id.pretty_name();
      std::string name = id.name();
      return name;
    };
  };

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