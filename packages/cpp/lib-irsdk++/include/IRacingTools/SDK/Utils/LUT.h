#pragma once
#include <algorithm>
#include <array>
#include <functional>
#include <stdexcept>
#include <utility>
#include <fmt/core.h>

namespace IRacingTools::SDK::Utils {
template<typename T, typename K>
using LUTKeyGetter = std::function<K(T &)>;

template<typename K, typename T, std::size_t N>
class LUT {
    std::array<std::pair<K, T>, N> elements_{};
    std::array<T,N> values_{};
    std::array<K,N> keys_{};

public:
    LUT() = delete;
    LUT(const LUT &other) = delete;
    LUT(LUT &&other) = delete;
    LUT &operator=(const LUT &other) = delete;
    LUT &operator=(LUT &&other) = delete;


    constexpr LUT(std::initializer_list<std::pair<K, T>> elements) {
        std::move(elements.begin(), elements.end(), elements_.begin());

        std::transform(elements_.begin(),elements_.end(),values_.begin(), [&] (auto& elem) {return std::get<1>(elem);});
        std::transform(elements_.begin(),elements_.end(),keys_.begin(), [&] (auto& elem) {return std::get<0>(elem);});

    }

    [[nodiscard]] constexpr std::size_t size() const {
        return N;
    }

    constexpr T lookup(const K &key) const {
        for (auto &[testKey, value] : elements_) {
            if (key == testKey) {
                return value;
            }
        }

        throw std::range_error("key not found");
    }

    constexpr T operator[](const K &key) const {
        return lookup(key);
    }

    constexpr const std::array<K,N>& keys() const {
        return keys_;
    }

    constexpr const std::array<T,N>& values() const {
        return values_;
    }


};
}
