#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingSDK/Utils/ThreadSafeContainer.h>
#include <IRacingTools/Models/RPC/Envelope.pb.h>
#include <IRacingTools/Models/RPC/Messages/IPCDataServerMessages.pb.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/IPC/NamedPipeServer.h>
#include <IRacingTools/Shared/IPC/NamedPipeServerRoute.h>
#include <IRacingTools/Shared/Services/Service.h>

#ifndef IPC_DATA_SERVER_PIPE_NAME
#define IPC_DATA_SERVER_PIPE_NAME "vrkit_iracing_data_server"
#endif

namespace IRacingTools::Shared::Services {
  using namespace IRacingSDK;
  using namespace Models;
  using namespace Common;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class IRacingIPCServer : public std::enable_shared_from_this<IRacingIPCServer>, public Service {



    public:

      struct Client {
        IPC::NamedPipeServer::ConnectionId id;
        IPC::NamedPipeServer::ConnectionWeakPtr connectionRef;
        std::shared_ptr<RPC::DataServer::IPCDataServerClientMetadata> metadata{nullptr};

        std::vector<Models::RPC::Events::SessionEventType> subscribedEvents{};

        std::vector<std::uint32_t> subscribedDataHeaderIndexes{};


        explicit Client(const IPC::NamedPipeServer::ConnectionPtr& connection);

        IPC::NamedPipeServer::ConnectionPtr getConnection();

      };

      using ClientPtr = std::shared_ptr<Client>;
      struct Options {
        bool useTaskQueue{false};
      };

      struct {
        // EventEmitter<RPCServerService*, const
        // std::vector<std::shared_ptr<TelemetryDataFile>>&> onFilesChanged{};
      } events;

      IRacingIPCServer() = delete;

      explicit IRacingIPCServer(const std::shared_ptr<ServiceContainer>& serviceContainer);

      explicit IRacingIPCServer(const std::shared_ptr<ServiceContainer>& serviceContainer, const Options& options);

      /**
       * @brief Initialize the service
       */
      virtual std::expected<bool, IRacingSDK::GeneralError> init() override;

      /**
       * @brief Must set running == true in overridden implementation
       */
      virtual std::expected<bool, IRacingSDK::GeneralError> start() override;

      virtual std::expected<bool, IRacingSDK::GeneralError> start(
        const std::shared_ptr<SessionDataProvider>& dataProvider
      );

      void removeDataProvider();

      virtual std::expected<bool, IRacingSDK::GeneralError> setDataProvider(
        const std::shared_ptr<SessionDataProvider>& dataProvider
      );

      /**
       * @brief Must set running == false in overridden implementation
       */
      virtual std::optional<IRacingSDK::GeneralError> destroy() override;

      IPC::Envelope execute(const IPC::Envelope& messageIn);

      void addRoute(const std::shared_ptr<IPC::NamedPipeServerRoute>& route);

      void setClientMetadata(std::uint32_t id, const std::shared_ptr<RPC::DataServer::IPCDataServerClientMetadata>& metadata);

      std::shared_ptr<RPC::DataServer::IPCDataServerClientMetadata> getClientMetadata(std::uint32_t id);

      virtual void onSessionEvent(
        Models::RPC::Events::SessionEventType eventType,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider
      );

    private:

      using ClientMessageEventHandlerFn = std::function<std::expected<bool, IRacingSDK::GeneralError>(

      Models::RPC::Events::SessionEventType eventType,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const ClientPtr& client,
        RPC::DataServer::IPCDataServerMessage& msg
      )>;

      using ClientMessageRequestHandlerFn = std::function<std::expected<bool, IRacingSDK::GeneralError>(
const std::shared_ptr<IRacingIPCServer>& server,
      const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const ClientPtr& client,
        const RPC::DataServer::IPCDataServerMessage& requestMessage,
        RPC::DataServer::IPCDataServerMessage& responseMessage
      )>;

      std::map<RPC::Events::SessionEventType, ClientMessageEventHandlerFn> clientMessageEventHandlerMap_;

      std::map<RPC::DataServer::IPCDataServerMessage::Type, ClientMessageRequestHandlerFn> clientMessageRequestHandlerMap_;

      //std::mutex clientMutex_{};
      Utils::ThreadSafeContainer<std::map<IPC::NamedPipeServer::ConnectionId, std::shared_ptr<
                                            IRacingIPCServer::Client>>> clientMap_{};
      std::optional<SessionDataProvider::UnsubscribeFn> dataProviderUnsubscribe_{};

      Options options_;
      std::mutex routesMutex_{};
      std::vector<std::shared_ptr<IPC::NamedPipeServerRoute>> routes_{};

      std::recursive_mutex dataMutex_{};
      std::shared_ptr<SessionDataProvider> dataProvider_{};
      std::recursive_mutex namedPipeServerMutex_{};
      std::shared_ptr<IPC::NamedPipeServer> namedPipeServer_{nullptr};
  };
} // namespace IRacingTools::Shared::Services
