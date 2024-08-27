//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <memory>

#include <IRacingTools/Models/Session/SessionState.pb.h>
#include <IRacingTools/Models/rpc/Events/SessionEvent.pb.h>
#include <IRacingTools/SDK/Utils/EventEmitter.h>
#include <IRacingTools/Shared/SessionDataEvent.h>


namespace IRacingTools::Shared {
    /**
     * @brief IRacing Data Service
     */
    //, std::shared_ptr<SessionDataEvent>
    class SessionDataProvider : public SDK::Utils::EventEmitter<
            Models::RPC::Events::SessionEventType, std::shared_ptr<Models::RPC::Events::SessionEventData>> {
    public:
        using SessionDataProviderPtr = std::shared_ptr<SessionDataProvider>;

        using Ptr = std::shared_ptr<SessionDataProvider>;

        virtual ~SessionDataProvider() = default;

        virtual SessionDataAccess& dataAccess() = 0;
        virtual SessionDataAccess* dataAccessPtr() = 0;
        virtual SDK::ClientProvider * clientProvider() = 0;
        virtual bool isAvailable() = 0;

        virtual bool start() = 0;
        virtual void stop() = 0;

        virtual bool isRunning() = 0;

        virtual bool isControllable() const = 0;

        virtual bool isLive() const = 0;

        virtual bool isPaused() = 0;
        virtual bool pause() = 0;
        virtual bool resume() = 0;

        /**
         * @brief Get current timing state
         *
         * When timing is updated, `SessionDataEvent::Updated` is fired
         *
         * @return current timing ref
         */
        virtual std::shared_ptr<Models::Session::SessionData> sessionData() = 0;

        virtual std::shared_ptr<SDK::SessionInfo::SessionInfoMessage> sessionInfo() = 0;
        virtual const SDK::VarHeaders& getDataVariableHeaders() = 0;
        //virtual std::vector<SDK::VarData*> getDataVariableHeaders() = 0;
    };
} // namespace IRacingTools::Shared
