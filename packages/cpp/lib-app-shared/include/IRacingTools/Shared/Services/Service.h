#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>
#include <mutex>

#include <IRacingTools/SDK/ErrorTypes.h>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/ServiceTypes.h>

#include <IRacingTools/Shared/Utils/Controllable.h>

namespace IRacingTools::Shared::Services {
    
    class ServiceContainer;

    class Service : public Utils::Controllable {
        
        public:
            using State = ServiceState;

            Service() = delete;
            
            virtual ~Service();

            /**
             * @brief Initialize the service
             */
            virtual std::expected<bool, SDK::GeneralError> init() override;

            /**
             * @brief Must set running == true in overriden implementation
             */
            virtual std::expected<bool, SDK::GeneralError>  start()  override;

            /**
             * @brief Must set running == false in overriden implementation
             */
            virtual std::optional<SDK::GeneralError> destroy() override;

            State state() const;

            /**
             * @brief Check if the service is running
             *
             * @return if service is currently running
             */
            bool isRunning();

            std::string name() const;

            std::shared_ptr<ServiceContainer> getContainer() const;

        protected:
            /**
             * @brief Construct a new Service object
             * 
             * @param name 
             */
            explicit Service(const std::shared_ptr<ServiceContainer>& serviceContainer, const std::string& name);

            /**
             * @brief Set the running value
             *
             * @param running new running value
             */
            State setState(State newState);
            
            std::recursive_mutex stateMutex_{};

        private:
            const std::shared_ptr<ServiceContainer> serviceContainer_;
            std::string name_;
            std::atomic<State> state_{State::Created};
    };
} // namespace IRacingTools::Shared::Geometry

#include <IRacingTools/Shared/Services/ServiceContainer.h>