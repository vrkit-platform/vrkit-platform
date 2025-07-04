#pragma once

#include <memory>
#include <stack>
#include <mutex>
#include <functional>
#include <iostream>

namespace VRKit::Shared::IPC {

  template <typename T>
  class ObjectPool {
    public:

      using ValueType = T;
      using PointerType = std::shared_ptr<T>;
      using FactoryType = std::function<T*()>;

      explicit ObjectPool(
        FactoryType factory = []() {
          return new T();
        }
      )
        : factory_(std::move(factory)) {
      }

      ~ObjectPool() = default;

      // Get object from pool or create new one if pool is empty
      PointerType acquire() {
        std::unique_lock lock(mutex_);
        if (!availableObjects_.empty()) {
          auto ptr = std::move(availableObjects_.top());
          availableObjects_.pop();
          return PointerType(ptr.release(), Deleter(*this));
        }

        return PointerType(factory_(), Deleter(*this));
      }

    private:

      // Custom deleter returns object to the pool
      struct Deleter {
        explicit Deleter(ObjectPool& pool) : pool_(pool) {
        }

        void operator()(T* ptr) const {
          std::scoped_lock lock(pool_.mutex_);
          pool_.availableObjects_.emplace(ptr); // return to pool
        }

        private:

          ObjectPool& pool_;
      };

      std::stack<std::unique_ptr<T>> availableObjects_;
      std::mutex mutex_;
      FactoryType factory_;
  };
}
