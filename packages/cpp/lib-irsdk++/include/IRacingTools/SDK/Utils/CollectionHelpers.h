//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <vector>

namespace IRacingTools::SDK::Utils {

    namespace rng = std::ranges;

    template <rng::range R>
    constexpr auto RangeToVector(R&& r) {
        using T = std::decay_t<rng::range_value_t<R>>;
        return std::vector<T>{r.begin(), r.end()};
    }

    /**
     * @brief
     * @tparam C container of type map<K,V>
     * @tparam K key
     * @tparam V value
     * @tparam Other other
     * @param map subject
     * @return vector of V
     */
    template <template <typename, typename,typename...> class C, typename K, typename V, typename...Other>
    std::vector<V> ValuesOf(const C<K,V,Other...>& map) {
        std::vector<V> list;
        for (const auto& [key, value] : map) {
            list.push_back(value);
        }

        return list;
    }

    /**
     * @brief
     * @tparam C container of type map<K,V>
     * @tparam K key
     * @tparam Other other
     * @param map subject
     * @return vector of V
     */
    template <template <typename, typename...> class C, typename K, typename...Other>
    std::vector<K> KeysOf(const C<K,Other...>& map) {
        std::vector<K> list;
        for (const auto& [key, value] : map) {
            list.push_back(key);
        }

        return list;
    }

    template <template <typename, typename...> class C, typename V, typename...Other>
    bool ContainsValue(const C<V,Other...>& container, const V& value) {
        for (auto& it : container) {
            if (value == it) {
                return true;
            }
        }

        return false;
    }


    template <template <typename, typename...> class C, typename V, class UnaryPred, typename...Other>
    std::optional<V> FindValue(const C<V,Other...>& container, UnaryPred predicate) {
        for (auto& it : container) {
            if (predicate(it)) {
                return std::make_optional<V>(it);
            }
        }

        return std::nullopt;
    }
}
