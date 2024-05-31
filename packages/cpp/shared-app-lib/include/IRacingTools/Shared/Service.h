#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared {
    class Service {
        public:
            virtual ~Service();

            /**
             * @brief Initialize the service
             */
            virtual void init();

            /**
             * @brief Must set running == true in overriden implementation
             */
            virtual void start();

            /**
             * @brief Must set running == false in overriden implementation
             */
            virtual void stop();

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
