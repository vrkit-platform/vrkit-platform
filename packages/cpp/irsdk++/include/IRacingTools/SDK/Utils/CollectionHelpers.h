//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <vector>

namespace IRacingTools::SDK::Utils {
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
}
