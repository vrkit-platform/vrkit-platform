#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/RPC/Envelope.pb.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/IPC/NamedPipeServer.h>
#include <IRacingTools/Shared/IPC/NamedPipeServerRoute.h>
#include <IRacingTools/Shared/Services/Service.h>

#define IPC_DATA_SERVER_PIPE_NAME "vrkit_iracing_data_server"

namespace IRacingTools::Shared::Services {

  using namespace Models;
  using namespace Common;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class IPCDataServerService
      : public std::enable_shared_from_this<IPCDataServerService>,
        public Service {

    struct Client {
      IPC::NamedPipeServer::ConnectionId id;
      IPC::NamedPipeServer::ConnectionWeakPtr connection;
      std::string description{};

      std::vector<SessionDataEventType> subscribedEvents{};

      std::vector<std::uint32_t> subscribedDataFrameIndexes{};


      explicit Client(const IPC::NamedPipeServer::ConnectionPtr& connection);

    };

    public:

    struct Options {
      bool useTaskQueue{false};
    };

    struct {
      // EventEmitter<RPCServerService*, const
      // std::vector<std::shared_ptr<TelemetryDataFile>>&> onFilesChanged{};
    } events;

    IPCDataServerService() = delete;
    explicit IPCDataServerService(const std::shared_ptr<ServiceContainer> &serviceContainer);
    explicit IPCDataServerService(const std::shared_ptr<ServiceContainer> &serviceContainer, const Options &options);

    /**
     * @brief Initialize the service
     */
    virtual std::expected<bool, IRacingSDK::GeneralError> init() override;

    /**
     * @brief Must set running == true in overridden implementation
     */
    virtual std::expected<bool, IRacingSDK::GeneralError> start() override;
    virtual std::expected<bool, IRacingSDK::GeneralError> start(const std::shared_ptr<SessionDataProvider>& dataProvider);

    void removeDataProvider();
    virtual std::expected<bool, IRacingSDK::GeneralError> setDataProvider(const std::shared_ptr<SessionDataProvider>& dataProvider);

    /**
     * @brief Must set running == false in overridden implementation
     */
    virtual std::optional<IRacingSDK::GeneralError> destroy() override;

    IPC::Envelope execute(const IPC::Envelope &messageIn);

    void addRoute(const std::shared_ptr<IPC::NamedPipeServerRoute>& route);

    virtual void onSessionEvent(Models::RPC::Events::SessionEventType eventType, const std::shared_ptr<Models::RPC::Events::SessionEventData>& eventData);

  private:


    std::mutex clientMutex_{};
    std::map<IPC::NamedPipeServer::ConnectionId,std::shared_ptr<IPCDataServerService::Client>> clientMap_{};
    std::optional<SessionDataProvider::UnsubscribeFn> dataProviderUnsubscribe_{};

      Options options_;
    std::mutex routesMutex_{};
    std::vector<std::shared_ptr<IPC::NamedPipeServerRoute>> routes_{};

    std::recursive_mutex dataMutex_{};
    std::shared_ptr<SessionDataProvider> dataProvider_{};
      std::recursive_mutex namedPipeServerMutex_{};
      std::shared_ptr<IPC::NamedPipeServer> namedPipeServer_ {nullptr};
  };
} // namespace IRacingTools::Shared::Services
