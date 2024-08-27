//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <memory>
#include <thread>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/Shared/SessionDataProvider.h>

namespace IRacingTools::Shared {
    class DiskSessionDataProvider : public SessionDataProvider {
    public:

        struct Options {
            /**
             * @brief Playback speed adjustment
             */
            float playbackSpeed{1.0f};

            /**
             * @brief Number of data frames to skip inbetween each data emit
             */
            std::size_t skipEmitDataFrames{0};
        };
        DiskSessionDataProvider() = delete;
        DiskSessionDataProvider(const DiskSessionDataProvider& other) = delete;
        DiskSessionDataProvider(DiskSessionDataProvider&& other) noexcept = delete;
        DiskSessionDataProvider& operator=(const DiskSessionDataProvider& other) = delete;
        DiskSessionDataProvider& operator=(DiskSessionDataProvider&& other) noexcept = delete;

        /**
         * @brief the only acceptable constructor
         */
        DiskSessionDataProvider(const std::filesystem::path& file, SDK::ClientId clientId, const std::optional<Options>& options = std::nullopt);

        /**
         * @brief Destructor required to stop any running threads
         */
        virtual ~DiskSessionDataProvider() override;

        virtual SessionDataAccess& dataAccess() override;
        virtual SessionDataAccess* dataAccessPtr() override;

        virtual SDK::ClientProvider * clientProvider() override;

        virtual bool isLive() const override;
        /**
         * @inherit
         */
        bool isAvailable() override;

        /**
         * @inherit
         */
        bool start() override;

        /**
         * @inherit
         */
        bool isRunning() override;

        /**
         * @inherit
         */
        void stop() override;

        virtual bool isControllable() const override {
            return true;
        };

        virtual bool isPaused() override;
        virtual bool pause() override;
        virtual bool resume() override;

        virtual std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo() override;
        virtual std::shared_ptr<Models::Session::SessionData> sessionData() override;
        virtual const SDK::VarHeaders& getDataVariableHeaders() override;
        const Options& options();
        void setOptions(const Options& newOptions);
    protected:
        void runnable();

    private:
        void init();

        void process();

        bool processYAMLLiveString();

        void checkConnection();

        std::shared_ptr<Models::RPC::Events::SessionEventData> createEventData(
            Models::RPC::Events::SessionEventType type
        );

        void fireDataUpdatedEvent();

        const Models::Session::SessionTiming* updateTiming();

        SDK::ClientId clientId_;
        std::filesystem::path file_;
        std::shared_ptr<SDK::DiskClient> diskClient_;
        std::unique_ptr<SessionDataAccess> dataAccess_;

        std::unique_ptr<std::thread> thread_{nullptr};
        std::mutex threadMutex_{};
        std::condition_variable threadProcessCondition_{};

        std::mutex diskClientMutex_{};

        std::condition_variable pausedCondition_{};
        std::atomic_bool paused_{false};
        std::atomic_bool running_{false};
        std::atomic_bool isAvailable_{false};
        DWORD lastUpdatedTime_{0};


        Options options_;

        std::shared_ptr<Models::Session::SessionData> sessionData_{};
    };
} // namespace IRacingTools::Shared
