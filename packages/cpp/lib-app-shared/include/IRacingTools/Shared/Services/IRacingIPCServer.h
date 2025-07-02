#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingSDK/Utils/ThreadSafeContainer.h>
#include <IRacingTools/Models/RPC/Envelope.pb.h>
#include <IRacingTools/Models/RPC/Messages/IRacingIPCMessages.pb.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/IPC/NamedPipeServer.h>
#include <IRacingTools/Shared/IPC/NamedPipeServerRoute.h>
#include <IRacingTools/Shared/Services/Service.h>

#ifndef IRACING_IPC_SERVER_PIPE_NAME
#define IRACING_IPC_SERVER_PIPE_NAME "vrkit_iracing_ipc_server"
#endif

namespace IRacingTools::Shared::Services {
  using namespace IRacingSDK;
  using namespace Models;
  using namespace Common;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class IRacingIPCServer : public std::enable_shared_from_this<IRacingIPCServer> {


    public:

      struct Client {
        IPC::NamedPipeServer::ConnectionId id;
        IPC::NamedPipeServer::ConnectionWeakPtr connectionRef;
        std::shared_ptr<RPC::IR::IRacingIPCClientMetadata> metadata{nullptr};

        std::vector<Models::RPC::Events::SessionEventType> subscribedEvents{};

        std::vector<std::uint32_t> subscribedDataHeaderIndexes{};


        explicit Client(const IPC::NamedPipeServer::ConnectionPtr& connection);

        IPC::NamedPipeServer::ConnectionPtr getConnection();

      };

      using ClientPtr = std::shared_ptr<Client>;

      struct Options {
        bool useTaskQueue{false};
      };

      IRacingIPCServer() = delete;

      explicit IRacingIPCServer(const std::shared_ptr<SessionDataProvider>& dataProvider);

      explicit IRacingIPCServer(const std::shared_ptr<SessionDataProvider>& dataProvider, const Options& options);

      /**
       * @brief Must set running == false in overridden implementation
       */
      virtual std::optional<IRacingSDK::GeneralError> destroy();

      IPC::Envelope execute(const IPC::Envelope& messageIn);

      void addRoute(const std::shared_ptr<IPC::NamedPipeServerRoute>& route);

      void
      setClientMetadata(std::uint32_t id, const std::shared_ptr<RPC::IR::IRacingIPCClientMetadata>& metadata);

      std::shared_ptr<RPC::IR::IRacingIPCClientMetadata> getClientMetadata(std::uint32_t id);

      virtual void onSessionEvent(
        Models::RPC::Events::SessionEventType eventType,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider
      );

      std::string getNamedPipePath() const;

      std::expected<bool, IRacingSDK::GeneralError> start();

    private:

      /**
       * @brief Handles incoming messages from the named pipe server
       *
       * @param size Size of the message
       * @param data Data of the message
       * @param header Header of the message
       * @param connection Connection that sent the message
       * @param server Server that received the message
       */
      void handleNamedPipeMessage(
        std::size_t size,
        IPC::NamedPipeServer::MessageDataType data,
        const IPC::NamedPipeMessageHeader* header,
        std::shared_ptr<IPC::NamedPipeConnection> connection,
        std::shared_ptr<IPC::NamedPipeServer> server
      );

      using ClientMessageEventHandlerFn = std::function<std::expected<bool, IRacingSDK::GeneralError>(
        Models::RPC::Events::SessionEventType eventType,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const ClientPtr& client,
        RPC::IR::IRacingIPCMessage& msg
      )>;

      using ClientMessageRequestHandlerFn = std::function<std::expected<bool, IRacingSDK::GeneralError>(
        const std::shared_ptr<IRacingIPCServer>& server,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const ClientPtr& client,
        const RPC::IR::IRacingIPCMessage& requestMessage,
        RPC::IR::IRacingIPCMessage& responseMessage
      )>;

      std::map<RPC::Events::SessionEventType, ClientMessageEventHandlerFn> clientMessageEventHandlerMap_;

      std::map<RPC::IR::IRacingIPCMessageType, ClientMessageRequestHandlerFn> clientMessageRequestHandlerMap_;

      Utils::ThreadSafeContainer<std::map<IPC::NamedPipeServer::ConnectionId, std::shared_ptr<
                                            IRacingIPCServer::Client>>> clientMap_{};

      std::shared_ptr<SessionDataProvider> dataProvider_;
      IRacingSDK::Utils::EventEmitterUnsubscribeFn dataProviderUnsubscribe_;
      Options options_;
      std::string namedPipeServerName_;
      std::shared_ptr<IPC::NamedPipeServer> namedPipeServer_;


      std::mutex routesMutex_{};
      std::vector<std::shared_ptr<IPC::NamedPipeServerRoute>> routes_{};

      std::recursive_mutex dataMutex_{};

      std::recursive_mutex namedPipeServerMutex_{};

  };


} // namespace IRacingTools::Shared::Services
