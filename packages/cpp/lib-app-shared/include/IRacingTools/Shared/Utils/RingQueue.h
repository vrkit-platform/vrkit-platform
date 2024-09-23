#pragma once


#include <mutex>
#include <optional>

#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Utils {
  template <typename T, std::size_t Size>
  class RingQueue {
  public:
    RingQueue() : head_(0), tail_(0), full_(false) {}

    ~RingQueue() {
      destroy();
    }

    void destroy() {
      if (destroyed_.exchange(true)) {
        return;
      }

      // fullCondition_.notify_all();
      // emptyCondition_.notify_all();
    }

    bool push(const T& item) {
      std::scoped_lock lock(mutex_);
      // fullCondition_.wait(lock, [this] { return !full_ || destroyed_; });
      if (destroyed_ || full_)
        return false;

      data_[head_] = item;
      if (full_) {
        tail_ = (tail_ + 1) % Size;
      }
      head_ = (head_ + 1) % Size;
      full_ = head_ == tail_;
    }

    std::optional<T> pop() {
      std::scoped_lock lock(mutex_);

      // emptyCondition_.wait(lock, [this] { return !empty() || destroyed_; });

      if (destroyed_ || empty()) {
        return std::nullopt;
      }

      auto value = std::make_optional<T>(data_[tail_]);
      full_ = false;
      tail_ = (tail_ + 1) % Size;

      //lock.unlock();
      // fullCondition_.notify_one();

      return value;
    }

    std::optional<T> front() const {
      std::scoped_lock lock(mutex_);
      if (empty()) {
        return std::nullopt;
      }
      return data_[tail_];
    }

    bool empty()  {
      std::scoped_lock lock(mutex_);
      return !full_ && head_ == tail_;
    }

    bool full()  {
      return full_;
    }

    std::size_t size() const {
      std::scoped_lock lock(mutex_);
      std::size_t size = Size;

      if (!full_) {
        if (head_ >= tail_) {
          size = head_ - tail_;
        } else {
          size = Size + head_ - tail_;
        }
      }

      return size;
    }

    std::size_t capacity() const {
      return Size;
    }

    void clear(T value) {
      std::scoped_lock lock(mutex_);
      for (int i = 0; i < Size; i++) {
        data_[i] = value;
      }

      head_ = 0;
      tail_ = 0;
      full_ = false;
    }

  private:
    std::array<T, Size> data_{};
    std::size_t head_;
    std::size_t tail_;
    std::atomic_bool full_;

    std::atomic_bool destroyed_{false};

    mutable std::recursive_mutex mutex_{};
    // std::condition_variable fullCondition_{};
    // std::condition_variable emptyCondition_{};
  };
}