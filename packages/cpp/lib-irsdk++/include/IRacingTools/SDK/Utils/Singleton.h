//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <memory>

namespace IRacingTools::SDK::Utils {
template<typename T>
class Singleton {
public:

    static std::shared_ptr<T> GetPtr();
    static T &GetInstance();
    static T &Get();

    Singleton(const Singleton &) = delete;
    Singleton &operator=(const Singleton) = delete;


protected:
    struct token {};

    Singleton() = default;
};


template<typename T>
std::shared_ptr<T> Singleton<T>::GetPtr() {
  static const std::shared_ptr<T> instance{new T{token{}}};
  return instance;
}

template<typename T>
T &Singleton<T>::GetInstance() {
    return *GetPtr().get();
}

template<typename T>
T &Singleton<T>::Get() {
    return GetInstance();
}

}
