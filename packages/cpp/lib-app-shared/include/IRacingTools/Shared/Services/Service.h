#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Utils/Controllable.h>
#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Services {
    
    class Service : public Utils::Controllable {
        
        
        public:
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
            virtual void stop() override;

            virtual void destroy() override;

            /**
             * @brief Check if the service is running
             *
             * @return if service is currently running
             */
            bool isRunning();

            const std::string_view &name() const;

        protected:
            /**
             * @brief Construct a new Service object
             * 
             * @param name 
             */
            explicit Service(const std::string_view& name);

            /**
             * @brief Set the running value
             *
             * @param running new running value
             */
            void setRunning(bool running);

        private:
            const std::string_view name_;
            std::atomic_bool running_{false};
    };
} // namespace IRacingTools::Shared::Geometry
