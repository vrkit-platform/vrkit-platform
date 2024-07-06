#pragma once

#include <cstdio>
#include <format>
#include <iostream>
#include <list>
#include <map>
#include <ranges>
#include <spdlog/spdlog.h>
#include <cstdlib>
#include <string>
#include <string_view>
#include <tuple>

#include <boost/type_index.hpp>

namespace IRacingTools::SDK::Utils {
  namespace log = spdlog;


  template<typename T> struct PrettyType {
    constexpr std::string_view name() {
      return boost::typeindex::type_id_with_cvr<T>().pretty_name();
    };

    // std::string_view operator() {
    //     return name();
    // };
  };


  template<typename T> log::logger GetCategoryWithType() {
    return log::logger(std::string(PrettyType<T>().name()));
  };

  template<::std::size_t ColumnCount>
  size_t GetStringViewMaxLength(const ::std::array<::std::string_view, ColumnCount> &headers) {
    auto res = std::ranges::max_element(headers, [](const auto &a, const auto &b) {
      return a.length() < b.length();
    });
    return (*res).length();
  }

  template<typename TupleLike, ::std::size_t I = 0> void printTupleValues(TupleLike &values, ::std::size_t ColLength) {
    //    if constexpr (I == 0)
    //        std::cout << typeid(TupleLike).name() << '\n';
    //
    if constexpr (I < std::tuple_size_v<TupleLike>) {
      //        std::cout << std::get<I>(values);
      std::cout << std::format("{: >{}}", std::get<I>(values), ColLength);
      printTupleValues<TupleLike, I + 1>(values, ColLength);
    }
  }


  template<::std::size_t ColumnCount, typename... ColumnTypes>
  void PrintTabularData(std::array<std::string_view, ColumnCount> headers, std::list<std::tuple<ColumnTypes...>> rows) {
    const auto ColLength = 32;

    // print headers:
    for (const auto &name: headers)
      std::cout << std::format("{: >{}}", name, ColLength);
    std::cout << '\n';

    // print values:
    for (std::tuple<ColumnTypes...> &values: rows) {
      printTupleValues<std::tuple<ColumnTypes...>, 0>(values, ColLength);
      //        for (std::size_t i = 0; i < ColumnCount;i++) {
      //
      ////            std::cout << std::format("{:>{}.2f}", std::getvalues, ColLength);
      //        }
      std::cout << '\n';
    }
  }
} 


  template<class T, class CharT, class Traits> ::std::basic_ostream<CharT, Traits> &
  operator<<(::std::basic_ostream<CharT, Traits> &os, IRacingTools::SDK::Utils::PrettyType<T> type) {
    return os << type.name();
  };