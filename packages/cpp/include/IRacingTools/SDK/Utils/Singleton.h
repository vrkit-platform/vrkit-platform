//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <memory>

namespace IRacingTools::SDK::Utils {
template<typename T>
class Singleton {
public:
    static T &GetInstance();

    Singleton(const Singleton &) = delete;
    Singleton &operator=(const Singleton) = delete;

protected:
    struct token {};

    Singleton() {}
};


template<typename T>
T &Singleton<T>::GetInstance() {
    static const std::unique_ptr<T> instance{new T{token{}}};
    return *instance;
}
}
