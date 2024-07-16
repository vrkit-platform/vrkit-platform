#pragma once
#include <mutex>
#include <thread>


#include <spdlog/spdlog.h>


namespace IRacingTools::SDK::Utils {

    class RunnableThread {
    public:
        virtual ~RunnableThread() = default;

        void stop();

        void start();

        void join();

        virtual void runnable() = 0;

        bool isRunning();

    protected:
        void runnableWrapper();

        std::mutex mutex_{};
        std::atomic_bool running_{false};
        std::unique_ptr<std::thread> thread_{nullptr};
    };
}
