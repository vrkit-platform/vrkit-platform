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

        void setThreadName(const std::string& threadName);

    protected:
        void runnableWrapper();

        std::mutex mutex_{};
        std::atomic_bool running_{false};
        std::unique_ptr<std::thread> thread_{nullptr};
    };


    class FnIndefiniteThread : public RunnableThread {
    public:
        using Fn = std::function<void(FnIndefiniteThread*)>;
        explicit FnIndefiniteThread(Fn fn);
        FnIndefiniteThread() = delete;
        virtual ~FnIndefiniteThread() = default;

        virtual void runnable() override;

    private:
        Fn fn_;
    };
}
