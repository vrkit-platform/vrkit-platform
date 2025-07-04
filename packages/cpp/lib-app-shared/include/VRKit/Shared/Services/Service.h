#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>
#include <expected>
#include <mutex>

#include <IRacingSDK/ErrorTypes.h>

#include <VRKit/Shared/ProtoHelpers.h>
#include <VRKit/Shared/Services/ServiceTypes.h>

#include <VRKit/Shared/Utils/Controllable.h>

namespace VRKit::Shared::Services {
    
    class ServiceContainer;

    class Service : public Utils::Controllable {
        
        public:
            using State = ServiceState;

            Service() = delete;
            
            virtual ~Service();

            /**
             * @brief Initialize the service
             */
            virtual std::expected<bool, IRacingSDK::GeneralError> init() override;

            /**
             * @brief Must set running == true in overridden implementation
             */
            virtual std::expected<bool, IRacingSDK::GeneralError>  start()  override;

            /**
             * @brief Must set running == false in overridden implementation
             */
            virtual std::optional<IRacingSDK::GeneralError> destroy() override;

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
} // namespace VRKit::Shared::Geometry

#include <VRKit/Shared/Services/ServiceContainer.h>