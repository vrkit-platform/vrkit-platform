//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <algorithm>
#include <array>
#include <atomic>
#include <cassert>
#include <cmath>
#include <functional>
#include <mutex>
#include <ranges>
#include <type_traits>
#include <vector>

#include "Traits.h"

namespace IRacingTools::SDK::Utils {

template<typename... Args>
class EventEmitter {
public:
    using SubscribedFn = std::function<void(Args...)>;
    struct Subscription {
        const int key;
        const SubscribedFn fn;

        Subscription(const int key, const SubscribedFn &fn) : key(key), fn(fn) {}
    };

    using UnsubscribeFn = std::function<void()>;
    using Subscriptions = std::vector<Subscription>;

    EventEmitter() = default;
    virtual ~EventEmitter() = default;

    const std::vector<SubscribedFn> subscriptions() {
        std::scoped_lock lock(subscriptionMutex_);
        std::vector<SubscribedFn> fns{};
        std::transform(subscriptions_.begin(), subscriptions_.end(), std::back_inserter(fns), [](auto &holder) {
            return holder.fn;
        });

        return fns;
    }

    UnsubscribeFn subscribe(const SubscribedFn &listener) {
        std::scoped_lock lock(subscriptionMutex_);
        int key = nextKey_++;
        subscriptions_.emplace_back(key, listener);

        return [key, this]() { this->unsubscribe(key); };
    }

    void unsubscribe(const int key) {
        std::scoped_lock lock(subscriptionMutex_);
//        std::remove_if(subscriptions_.begin(), subscriptions_.end(),[key] (auto& holder) {
//            return key == holder.key;
//        });
    }

    void publish(Args... args) {
        std::scoped_lock lock(subscriptionMutex_);
        for(auto& holder : subscriptions_) {
            holder.fn(args...);
        }
    }

private:
    std::mutex subscriptionMutex_{};
    Subscriptions subscriptions_{};
    std::atomic_int nextKey_{0};
};

} // namespace IRacingTools::SDK::Utils
