#pragma once

#include <algorithm>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <mutex>
#include <set>
#include <stack>
#include <thread>
#include <vector>

namespace IRacingTools::Shared::Chrono {
    // Aliased types
    using TimerId = std::size_t;
    using HandlerFn = std::function<void(TimerId)>;
    using Clock = std::chrono::steady_clock;
    using Timestamp = std::chrono::time_point<Clock>;
    using Duration = std::chrono::microseconds;

    // Private definitions. Do not rely on this namespace.
    namespace detail {
        // The event structure that holds the information about a timer.
        struct Event {
            TimerId id;
            Timestamp start;
            Duration period;
            HandlerFn handler;
            bool valid;

            Event() : id(0), start(Duration::zero()), period(Duration::zero()), handler(nullptr), valid(false) {}

            template <typename Func>
            Event(TimerId id, Timestamp start, Duration period, Func&& handler) : id(id),
                start(start),
                period(period),
                handler(std::forward<Func>(handler)),
                valid(true) {}

            Event(Event&& r) = default;
            Event& operator=(Event&& ev) = default;
            Event(const Event& r) = delete;
            Event& operator=(const Event& r) = delete;
        };

        // A time event structure that holds the next timeout and a reference to its
        // Event struct.
        struct TimeEvent {
            Timestamp next;
            TimerId ref;
        };

        inline bool operator<(const TimeEvent& l, const TimeEvent& r) {
            return l.next < r.next;
        }
    } // end namespace detail

    class Timer {
        using UniqueLock = std::unique_lock<std::mutex>;

        // Thread and locking variables.
        std::mutex mutex_;
        std::condition_variable cond_;
        std::thread worker_;

        // Use to terminate the timer thread.
        bool done_ = false;

        // The vector that holds all active events.
        std::vector<detail::Event> events_;
        // Sorted queue that has the next timeout at its top.
        std::multiset<detail::TimeEvent> timeEvents_;

        // A list of ids to be re-used. If possible, ids are used from this pool.
        std::stack<TimerId> freeIds_;

    public:
        Timer() : mutex_{}, cond_{}, worker_{}, events_{}, timeEvents_{}, freeIds_{} {
            UniqueLock lock(mutex_);
            done_ = false;
            worker_ = std::thread([this] { run(); });
        }

        ~Timer() {
            UniqueLock lock(mutex_);
            done_ = true;
            lock.unlock();
            cond_.notify_all();
            worker_.join();
            events_.clear();
            timeEvents_.clear();
            while (!freeIds_.empty()) {
                freeIds_.pop();
            }
        }

        /**
         * Add a new timer.
         *
         * \param when The time at which the handler is invoked.
         * \param handler The callable that is invoked when the timer fires.
         * \param period The periodicity at which the timer fires. Only used for periodic timers.
         */
        TimerId add(const Timestamp& when, HandlerFn&& handler, const Duration& period = Duration::zero()) {
            UniqueLock lock(mutex_);
            TimerId id = 0;
            // Add a new event. Prefer an existing and free id. If none is available, add
            // a new one.
            if (freeIds_.empty()) {
                id = events_.size();
                detail::Event e(id, when, period, std::move(handler));
                events_.push_back(std::move(e));
            }
            else {
                id = freeIds_.top();
                freeIds_.pop();
                detail::Event e(id, when, period, std::move(handler));
                events_[id] = std::move(e);
            }
            timeEvents_.insert(detail::TimeEvent{when, id});
            lock.unlock();
            cond_.notify_all();
            return id;
        }

        /**
         * Overloaded `add` function that uses a `std::chrono::duration` instead of a
         * `time_point` for the first timeout.
         */
        template <class Rep, class Period>
        inline TimerId add(
            const std::chrono::duration<Rep, Period>& when,
            HandlerFn&& handler,
            const Duration& period = Duration::zero()
        ) {
            return add(
                Clock::now() + std::chrono::duration_cast<std::chrono::microseconds>(when),
                std::move(handler),
                period
            );
        }

        /**
         * Overloaded `add` function that uses a uint64_t instead of a `time_point` for
         * the first timeout and the period.
         */
        inline TimerId add(const uint64_t when, HandlerFn&& handler, const uint64_t period = 0) {
            return add(Duration(when), std::move(handler), Duration(period));
        }

        /**
         * Removes the timer with the given id.
         */
        bool remove(TimerId id) {
            UniqueLock lock(mutex_);
            if (events_.size() == 0 || events_.size() <= id) {
                return false;
            }
            events_[id].valid = false;
            events_[id].handler = nullptr;
            auto it = std::find_if(
                timeEvents_.begin(),
                timeEvents_.end(),
                [&](const detail::TimeEvent& te) {
                    return te.ref == id;
                }
            );
            if (it != timeEvents_.end()) {
                freeIds_.push(it->ref);
                timeEvents_.erase(it);
            }
            lock.unlock();
            cond_.notify_all();
            return true;
        }

    private:
        void run() {
            UniqueLock lock(mutex_);

            while (!done_) {
                if (timeEvents_.empty()) {
                    // Wait for work
                    cond_.wait(lock);
                }
                else {
                    detail::TimeEvent te = *timeEvents_.begin();
                    if (Clock::now() >= te.next) {
                        // Remove time event
                        timeEvents_.erase(timeEvents_.begin());

                        // Invoke the handler
                        lock.unlock();
                        events_[te.ref].handler(te.ref);
                        lock.lock();

                        if (events_[te.ref].valid && events_[te.ref].period.count() > 0) {
                            // The event is valid and a periodic timer.
                            te.next += events_[te.ref].period;
                            timeEvents_.insert(te);
                        }
                        else {
                            // The event is either no longer valid because it was removed in the
                            // callback, or it is a one-shot timer.
                            events_[te.ref].valid = false;
                            events_[te.ref].handler = nullptr;
                            freeIds_.push(te.ref);
                        }
                    }
                    else {
                        cond_.wait_until(lock, te.next);
                    }
                }
            }
        }
    };
} // namespace IRacingTools::Shared
