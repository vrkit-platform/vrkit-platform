#pragma once


#include <deque>
#include <future>
#include <memory>
#include <mutex>
#include <optional>
#include <thread>
#include <type_traits>
#include <vector>
#include <IRacingTools/SDK/Utils/ThreadHelpers.h>

namespace IRacingTools::Shared::Common {

  /**
   * @brief A task queue with an internal thread pool
   *
   * @tparam R task return type
   * @tparam Args arguments required to enqueue a task
   */
  template<class R, class... Args>
  class TaskQueue {
  public:
    using ReturnType = R;
    using ArgsType = std::tuple<Args...>;
    using FutureType = std::future<R>;

    /**
     * @brief Function type definition for the constructor
     */
    using FnType = std::function<R(Args...)>;

    /**
     * @brief Task type definition for each task
     */
    using TaskType = std::packaged_task<R()>;

    /**
     * @brief Task Queue Options
     */
    struct Options {
      std::optional<std::size_t> threadCount{1};
    };

    /**
     * @brief Default options used if none provided
     */
    static constexpr Options DefaultOptions{};



    TaskQueue() = delete;
    TaskQueue(TaskQueue &&) = delete;

    /**
     * @brief Only valid queue constructor
     *
     * @param fn function responsible for handling all enqueued tasks
     * @param overrideOptions optional override options for the queue
     */
    explicit TaskQueue(
        FnType fn, const std::optional<Options> &overrideOptions = std::nullopt)
        : fn_(std::move(fn)) {
      auto options = DefaultOptions;
      if (overrideOptions) {
        auto &it = overrideOptions.value();
        if (it.threadCount)
          options.threadCount = it.threadCount;
      }

      options_ = std::move(options);

      for (auto i = 0; i < options_.threadCount.value(); i++) {
        threads_.emplace_back(&TaskQueue::runnable, this);
        SDK::Utils::SetThreadName(&threads_.back(), std::format("TaskQueue-Thread-{}", i));
      }
    }

    virtual ~TaskQueue() {
      destroy();
    }

    FutureType enqueue(Args ...args) {
      FutureType future{};
      {
        std::scoped_lock lock(mutex_);
        if (!enabled_)
          return future;

        auto boundFn = std::bind(fn_, std::forward<Args>(args)...);
        queue_.emplace_back(boundFn);
        future = queue_.back().get_future();
      }
      cv_.notify_one();

      return future;
    }

    void destroy() {
      {
        std::scoped_lock lock(mutex_);
        if (!enabled_)
          return;

        enabled_ = false;
      }

      cv_.notify_all();

      for (auto &t: threads_) {
        if (t.joinable()) {
          t.join();
        }
      }
    }

    Options options() const {
      return options_;
    }

    std::size_t pendingTaskCount() {
      std::scoped_lock lock(mutex_);

      return queue_.size();
    }

    bool hasPendingTasks() {
      return pendingTaskCount() > 0;
    }

  protected:
    void runnable() {
      thread_local TaskType task;
      while (enabled_) {
        {
          std::unique_lock lock(mutex_);
          cv_.wait(lock, [&] {
            return !enabled_ || !queue_.empty();
          });
          if (!enabled_)
            return;

          task.swap(queue_.front());
          queue_.pop_front();
        }
        task();
      }
    }

  private:
    FnType fn_;
    Options options_;
    std::vector<std::thread> threads_{};
    std::deque<TaskType> queue_{};
    std::mutex mutex_{};
    std::condition_variable cv_{};

    std::atomic_bool enabled_{true};
  };
} // namespace IRacingTools::Shared::Common