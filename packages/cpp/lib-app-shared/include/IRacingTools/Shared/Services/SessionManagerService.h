#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/TelemetryDataFile.pb.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutor.h>
#include <IRacingTools/Shared/Services/Service.h>
#include <Session/SessionState.pb.h>

#include <IRacingTools/Shared/SessionDataProvider.h>


namespace IRacingTools::Shared {
    namespace Services {
        // using namespace Models;
        using namespace Common;

        /**
         * @brief Responsible for handling telemetry data files
         */
        class SessionManagerService : public std::enable_shared_from_this<SessionManagerService>, public Service {
        public:
            static constexpr std::string_view LiveSessionId = magic_enum::enum_name(Models::Session::SESSION_TYPE_LIVE);

            SessionManagerService() = delete;

            virtual ~SessionManagerService();
            /**
             * @brief Simple constructor
             */
            explicit SessionManagerService(const std::shared_ptr<ServiceContainer>& serviceContainer);


            /**
             * @brief check if `TelemetryDataFile` exists.
             *
             * @param sessionId of track map.
             * @return whether it exists in the loaded config map.
             */
            bool exists(const std::string& sessionId);


            /**
             * @brief Get existing data provider by sessionId
             *
             * @param sessionId
             * @return
             */
            template <typename T = SessionDataProvider, typename = std::enable_if<std::is_base_of_v<
                          SessionDataProvider, T>>>
            std::shared_ptr<T> get(const std::string& sessionId = LiveSessionId.data()) {
                if (!dataProviders_.contains(sessionId)) {
                    return std::shared_ptr<T>();
                }
                return std::static_pointer_cast<T>(dataProviders_[sessionId]);
            }

            /**
             * @brief
             * @param sessionId to map the dataProvider to
             * @param dataProvider `SessionDataProvider` shared pointer or nullptr to remove an entry mapped to `sessionId`
             * @return The current value, before this call of the `dataProvider` for the `sessionId`
             */
            template <typename T = SessionDataProvider, typename = std::enable_if<std::is_base_of_v<
                          SessionDataProvider, T>>>
            std::shared_ptr<T> set(const std::string& sessionId, const std::shared_ptr<T>& dataProvider = nullptr) {
                std::shared_ptr<T> currentDataProvider{};
                if (dataProviders_.contains(sessionId)) currentDataProvider = dataProviders_[sessionId];

                dataProviders_[sessionId] = dataProvider;
                return currentDataProvider;
            }

            template <typename T = SessionDataProvider, typename = std::enable_if<std::is_base_of_v<
                          SessionDataProvider, T>>>
            std::shared_ptr<SessionDataProvider> remove(const std::string& sessionId) {
                std::shared_ptr<T> currentDataProvider{};
                if (dataProviders_.contains(sessionId)) currentDataProvider = dataProviders_[sessionId];

                dataProviders_.erase(sessionId);
                return currentDataProvider;
            }

            template <typename T = SessionDataProvider, typename = std::enable_if<std::is_base_of_v<
                          SessionDataProvider, T>>>
            std::vector<std::shared_ptr<T>> allOfType(Models::Session::SessionType type) {
                std::vector<std::shared_ptr<T>> results;
                for (auto& val : dataProviders_ | std::views::values) {
                    if ((type == Models::Session::SessionType::SESSION_TYPE_LIVE && !val->isLive()) || (type != Models::Session::SessionType::SESSION_TYPE_LIVE && val->isLive())) {
                        continue;
                    }

                    results.push_back(std::static_pointer_cast<T>(val));
                }

                return results;
            }

            std::size_t size();

            /**
             * @brief Initialize the service
             */
            virtual std::expected<bool, SDK::GeneralError> init() override;

            /**
             * @brief Must set running == true in overridden implementation
             */
            virtual std::expected<bool, SDK::GeneralError> start() override;

            /**
             * @brief Must set running == false in overridden implementation
             */
            virtual std::optional<SDK::GeneralError> destroy() override;

            struct {
                EventEmitter<SessionManagerService*, const std::shared_ptr<SessionDataProvider>&> onChanged{};
                EventEmitter<SessionManagerService*, const std::shared_ptr<SessionDataProvider>&> onSet{};
                EventEmitter<SessionManagerService*, const std::shared_ptr<SessionDataProvider>&> onRemoved{};
            } events;

        private:
            std::map<std::string, std::shared_ptr<SessionDataProvider>> dataProviders_{};
        };
    } // namespace IRacingTools::Shared::Services
}
