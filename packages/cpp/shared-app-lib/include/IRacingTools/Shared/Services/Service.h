#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <expected>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::Services {
    class Service {
        public:
            virtual ~Service();

            /**
             * @brief Initialize the service
             */
            virtual std::expected<bool, SDK::GeneralError> init();

            /**
             * @brief Must set running == true in overriden implementation
             */
            virtual std::expected<bool, SDK::GeneralError>  start();

            /**
             * @brief Must set running == false in overriden implementation
             */
            virtual void stop();

            virtual void destroy();

            /**
             * @brief Check if the service is running
             *
             * @return if service is currently running
             */
            bool isRunning();

        protected:
            /**
             * @brief Set the running value
             *
             * @param running new running value
             */
            void setRunning(bool running);

        private:
            std::atomic_bool running_{false};
    };
} // namespace IRacingTools::Shared::Geometry
