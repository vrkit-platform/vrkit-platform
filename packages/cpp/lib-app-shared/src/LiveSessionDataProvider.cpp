//
// Created by jglanz on 1/28/2024.
//

#include <cstdio>
#include <IRacingTools/SDK/LiveClient.h>

#include <IRacingTools/SDK/Utils/ThreadHelpers.h>
#include <IRacingTools/SDK/Utils/ChronoHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/LiveSessionDataProvider.h>
#include <IRacingTools/Shared/SessionDataAccess.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>


namespace IRacingTools::Shared {
    using namespace std::chrono_literals;
    using namespace IRacingTools::SDK;
    using namespace IRacingTools::SDK::Utils;

    namespace {
        auto L = Logging::GetCategoryWithType<LiveSessionDataProvider>();
    }
    
    void LiveSessionDataProvider::runnable() {
        init();
        while (true) {
            {
                std::scoped_lock lock(threadMutex_);
                if (!running_) break;
            }
            process();
        }
    }

    /**
     * @brief Initialize the live session data provider
     */
    void LiveSessionDataProvider::init() {
        std::scoped_lock lock(threadMutex_);
        if (!running_) {
            return;
        }

        // bump priority up so we get time from the sim
        SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

        // ask for 1ms timer so sleeps are more precise
        timeBeginPeriod(1);
    }

    /**
     * @brief Process newly received data frame
     * 
     */
    void LiveSessionDataProvider::processData() {
        auto& client = LiveClient::GetInstance();
        auto ev = createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_INFO_CHANGED);
        if (client.wasSessionInfoUpdated()) {
            L->info("SessionInfoUpdated (updateCount={})", client.getSessionInfoUpdateCount().value());
            publish(Models::RPC::Events::SESSION_EVENT_TYPE_INFO_CHANGED, ev);
        }

        ev->set_type(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME);
        publish(Models::RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME, ev);
    }

    void LiveSessionDataProvider::process() {
        // wait up to 16 ms for start of session or new data
        if (LiveClient::GetInstance().waitForData(16)) {
            processData();
        }
        // pump our connection status
        checkConnection();
    }


    void LiveSessionDataProvider::checkConnection() {
        auto isConnected = LiveClient::GetInstance().isConnected();
        if (isConnected_ == isConnected) return;

        //****Note, put your connection handling here
        isConnected_ = isConnected;
        publish(Models::RPC::Events::SESSION_EVENT_TYPE_AVAILABLE, createEventData(Models::RPC::Events::SESSION_EVENT_TYPE_AVAILABLE));
    }


    std::shared_ptr<Models::RPC::Events::SessionEventData> LiveSessionDataProvider::createEventData(Models::RPC::Events::SessionEventType type) {
        auto data = sessionData();
        auto ev = std::make_shared<Models::RPC::Events::SessionEventData>();
        ev->set_id(Common::NewUUID());
        ev->set_type(type);
        ev->set_session_id(data->id());
        ev->set_session_type(Models::Session::SESSION_TYPE_LIVE);
        ev->mutable_session_data()->CopyFrom(*data);

        return ev;
    }


    bool LiveSessionDataProvider::isLive() const {
        return true;
    }

    SessionDataAccess& LiveSessionDataProvider::dataAccess() {
        return dataAccess_;
    }

    bool LiveSessionDataProvider::isRunning() {
        return running_.load();
    }

    LiveSessionDataProvider::~LiveSessionDataProvider() {
        stop();
    }

    bool LiveSessionDataProvider::start() {
        std::scoped_lock lock(threadMutex_);
        if (running_.exchange(true) || thread_) {
            return true;
        }

        thread_ = std::make_unique<std::thread>(&LiveSessionDataProvider::runnable, this);
        Utils::SetThreadName(thread_.get(), "LiveSessionDataProvider");
        return running_;
    }

    void LiveSessionDataProvider::stop() {
        if (!running_ && !thread_) return;
        {
            std::scoped_lock lock(threadMutex_);
            running_ = false;
        }
        if (!thread_) {
            return;
        }

        if (thread_->joinable()) {
            thread_->join();
        }

        thread_.reset();
    }

    LiveSessionDataProvider::LiveSessionDataProvider() : SessionDataProvider(),
                                                         dataAccess_(LiveClient::GetPtr()->getProvider()) {
        sessionData_ = std::make_shared<Models::Session::SessionData>();
        auto timing = sessionData_->mutable_timing();
        timing->set_is_live(true);
        timing->set_is_valid(isAvailable());

        sessionData_->set_id(magic_enum::enum_name(Models::Session::SESSION_TYPE_LIVE).data());
        sessionData_->set_type(Models::Session::SESSION_TYPE_LIVE);
        sessionData_->set_status(Models::Session::SESSION_STATUS_READY);
    }

    bool LiveSessionDataProvider::isAvailable() {
        return isConnected_;
    }

    bool LiveSessionDataProvider::isPaused() {
        return false;
    }

    bool LiveSessionDataProvider::resume() {
        return false;
    }

    std::shared_ptr<Models::Session::SessionData> LiveSessionDataProvider::sessionData() {
        return sessionData_;
    }

    std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> LiveSessionDataProvider::sessionInfo() {
        auto weakInfo = LiveClient::GetInstance().getSessionInfo();

        return weakInfo.lock();
    }

    bool LiveSessionDataProvider::pause() {
        return false;
    }
} // namespace IRacingTools::Shared
