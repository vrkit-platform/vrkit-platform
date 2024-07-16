#pragma once

#include <gsl/util>

#include <spdlog/spdlog.h>

#include <IRacingTools/SDK/Utils/RunnableThread.h>

namespace IRacingTools::SDK::Utils {
    void RunnableThread::stop() {
        {
            std::scoped_lock lock(mutex_);
            running_ = false;
            if (!thread_)
                return;
        }

        if (thread_->joinable())
            thread_->join();

        std::scoped_lock lock(mutex_);
        if (thread_)
            thread_.reset();
    }

    void RunnableThread::start() {
        std::scoped_lock lock(mutex_);
        if (running_ || thread_)
            return;

        running_ = true;
        thread_ = std::make_unique<std::thread>(&RunnableThread::runnableWrapper, this);
    }

    void RunnableThread::join() {
        if (running_ && thread_ && thread_->joinable())
            thread_->join();
    }

    bool RunnableThread::isRunning() {
        return running_;
    }

    void RunnableThread::runnableWrapper() {
        auto cleanup = gsl::finally(
            [&] {
                std::scoped_lock lock(mutex_);
                if (!thread_) {
                    return;
                }
                if (std::this_thread::get_id() != thread_->get_id()) {
                    spdlog::critical(
                        "Runnable thread id does not match this_thread, improperly configured (this_thread::id={}, thread::id={})",
                        std::this_thread::get_id()._Get_underlying_id(),
                        thread_->get_id()._Get_underlying_id()
                    );
                    abort();
                }

                running_ = false;
            }
        );
        runnable();
    }
}
