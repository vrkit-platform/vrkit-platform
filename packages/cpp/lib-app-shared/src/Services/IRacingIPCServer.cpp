#include <VRKit/Models/RPC/Messages/IRacingIPCMessages.pb.h>
#include <VRKit/Shared/LiveSessionDataProvider.h>
#include <VRKit/Shared/Services/IRacingIPCServer.h>
#include <VRKit/Shared/Utils/ErrorHelpers.h>
#include <VRKit/Shared/Utils/ModelHelpers.h>

namespace VRKit::Shared::Services {
  using namespace Models::RPC::IR;

  namespace {
    auto L = Logging::GetCategoryWithType<IRacingIPCServer>();

    /**
     * Retrieves the next unique message identifier.
     *
     * This method generates a new unique identifier for a message, which can be used
     * to ensure that messages are distinct from one another in a system where unique
     * identification is required.
     *
     * @return A unique integer representing the next message identifier.
     */
    std::uint32_t NextMessageId() {
      static std::atomic_uint32_t MessageIdCounter{1};

      return ++MessageIdCounter;
    };

    template <typename MessageType>
    std::expected<bool, IRacingSDK::GeneralError>
    WriteMessageToConnection(
      const MessageType* msg,
      const IRacingIPCServer::ClientPtr& client,
      std::uint32_t sourceId = 0
    ) {
      auto connection = client->getConnection();
      if (!connection) {
        return std::unexpected(
          IRacingSDK::GeneralError::create<IRacingSDK::GeneralError>(
            ErrorCode::NotFound,
            "Unable to get connection for client {}",
            client->id
          )
        );
      }
      std::vector<char> msgBuffer;
      msgBuffer.resize(msg->ByteSizeLong(), 0);
      if (!msg->SerializeToArray(msgBuffer.data(), msgBuffer.size())) {
        auto errorMsg = std::format("Failed to serialize message for client(id={})", client->id);
        L->error(errorMsg);
        return std::unexpected(IRacingSDK::GeneralError(errorMsg));
      }

      auto writeRes = connection->writeMessage(
        NextMessageId(),
        sourceId,
        reinterpret_cast<const IPC::DynamicByteBuffer::ValueType*>(msgBuffer.data()),
        msgBuffer.size()
      );

      if (!writeRes) {
        auto errorMsg = std::format("Failed to send message to client(id={}): {}", client->id, writeRes.error().what());
        L->error(errorMsg);
        return std::unexpected(IRacingSDK::GeneralError(errorMsg));
      }

      return true;
    }

    namespace RequestHandlers {

      std::expected<bool, IRacingSDK::GeneralError> OnGetDataProviderId(
        const std::shared_ptr<IRacingIPCServer>& server,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const IRacingIPCServer::ClientPtr& client,
        const RPC::IR::IRacingIPCMessage& requestMessage,
        RPC::IR::IRacingIPCMessage& responseMessage
      ) {
        L->info("Populating IRacingIPCGetDataProviderId message for client {}", client->id);
        if (!dataProvider) {
          return LogAndReturnGeneralError("dataProvider is not set");
        }

        IRacingIPCDataProviderId dataProviderIdMessage;
        dataProviderIdMessage.set_id(dataProvider->id());
        responseMessage.mutable_payload()->PackFrom(dataProviderIdMessage);
        return true;
      }

      std::expected<bool, IRacingSDK::GeneralError> OnGetSessionMetadata(
        const std::shared_ptr<IRacingIPCServer>& server,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const IRacingIPCServer::ClientPtr& client,
        const RPC::IR::IRacingIPCMessage& requestMessage,
        RPC::IR::IRacingIPCMessage& responseMessage
      ) {
        L->debug("Populating session metadata message for client {}", client->id);
        if (!dataProvider) {
          return LogAndReturnGeneralError("dataProvider is not set");
        }

        auto sessionMetadata = dataProvider->getSessionMetadata(true);
        if (!sessionMetadata) {
          L->error("Unable to get session metadata");
          return std::unexpected(IRacingSDK::GeneralError("Unable to get session metadata"));
        }

        responseMessage.mutable_payload()->PackFrom(*sessionMetadata);
        return true;
      }

      std::expected<bool, IRacingSDK::GeneralError> OnGetSessionDataHeaders(
        const std::shared_ptr<IRacingIPCServer>& server,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const IRacingIPCServer::ClientPtr& client,
        const RPC::IR::IRacingIPCMessage& requestMessage,
        RPC::IR::IRacingIPCMessage& responseMessage
      ) {
        if (!dataProvider) {
          return LogAndReturnGeneralError("dataProvider is not set");
        }

        IRacingIPCSessionDataVarHeaders sessionDataVarHeaders{};
        auto sessionClient = sessionClientProvider->getClient();
        if (!sessionClient) {
          L->error("Unable to get session client");
          return std::unexpected(IRacingSDK::GeneralError("Unable to get session client"));
        }
        auto& headers = sessionClient->getVarHeaders();
        for (const auto& header : headers) {
          auto headerMessage = sessionDataVarHeaders.add_headers();
          auto headerIndexRes = sessionClient->getVarIdx(header.name);
          if (!headerIndexRes) {
            L->warn("Unable to find header for name {}", header.name);
            continue;
          }
          auto headerIndex = headerIndexRes.value();
          headerMessage->set_index(headerIndex);
          headerMessage->set_name(header.name);
          headerMessage->set_type(Utils::ToSessionDataVarType(header.type));
          headerMessage->set_count(header.count);
        }

        responseMessage.mutable_payload()->PackFrom(sessionDataVarHeaders);
        return true;
      }

      std::expected<bool, IRacingSDK::GeneralError> OnSetSubscriptions(
        const std::shared_ptr<IRacingIPCServer>& server,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& dataProvider,
        const IRacingIPCServer::ClientPtr& client,
        const RPC::IR::IRacingIPCMessage& requestMessage,
        RPC::IR::IRacingIPCMessage& responseMessage
      ) {
        if (!dataProvider) {
          return LogAndReturnGeneralError("dataProvider is not set");
        }

        auto setSubsRequest = std::make_shared<IRacingIPCSetSubscriptions>();
        if (!requestMessage.payload().UnpackTo(setSubsRequest.get())) {
          L->error("Unable to unpack SetSubscriptions message, clientId={}", client->id);
          return std::unexpected(IRacingSDK::GeneralError("Unable to unpack SetSubscriptions message"));
        }

        client->subscribedEvents.clear();
        client->subscribedDataHeaderIndexes.clear();
        for (auto eventTypeInt : setSubsRequest->event_types()) {
          auto eventType = static_cast<RPC::Events::SessionEventType>(eventTypeInt);
          L->debug("Subscribing client {} to event type {}", client->id, std::string{magic_enum::enum_name(eventType)});
          client->subscribedEvents.push_back(eventType);
        }

        for (auto varName : setSubsRequest->data_var_header_names()) {
          L->debug("Subscribing client {} to data var header name {}", client->id, varName);
          auto indexRes = sessionClientProvider->getClient()->getVarIdx(varName);
          if (!indexRes) {
            L->warn("Unable to find header for name {}", varName);
            continue;
          }
          auto index = indexRes.value();
          L->debug("Subscribing client {} to data var header ({}) index {}", client->id, varName, index);
          client->subscribedDataHeaderIndexes.push_back(index);
        }

        return true;
      }

      std::expected<bool, IRacingSDK::GeneralError> OnSetClientMetadata(
        const std::shared_ptr<IRacingIPCServer>& server,
        const std::shared_ptr<IRacingSDK::ClientProvider>&,
        const std::shared_ptr<SessionDataProvider>&,
        const IRacingIPCServer::ClientPtr& client,
        const RPC::IR::IRacingIPCMessage& requestMessage,
        RPC::IR::IRacingIPCMessage&
      ) {
        auto clientMetadata = std::make_shared<IRacingIPCClientMetadata>();
        if (!requestMessage.payload().UnpackTo(clientMetadata.get())) {
          L->error("Unable to unpack client metadata message, clientId={}", client->id);
          return std::unexpected(IRacingSDK::GeneralError("Unable to unpack client metadata message"));
        }

        server->setClientMetadata(client->id, clientMetadata);
        return true;
      }
    }

    namespace EventHandlers {
      std::expected<bool, IRacingSDK::GeneralError> OnSessionDataFrame(
        Models::RPC::Events::SessionEventType,
        const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& sessionDataProvider,
        const IRacingIPCServer::ClientPtr& client,
        RPC::IR::IRacingIPCMessage& msg
      ) {
        if (!sessionDataProvider) {
          return LogAndReturnGeneralError("dataProvider is not set");
        }
        L->debug("Populating session data frame message for client {}", client->id);
        Session::SessionDataFrame dataFrame{};
        dataFrame.mutable_timing()->CopyFrom(sessionDataProvider->getSessionTiming());

        auto sessionClient = sessionClientProvider->getClient();
        auto dataVarValues = dataFrame.mutable_data_values();
        for (auto headerIndex : client->subscribedDataHeaderIndexes) {
          auto headerRes = sessionClient->getVarHeader(headerIndex);
          if (!headerRes) {
            L->warn("Unable to find header for index {}", headerIndex);
            continue;
          }

          auto& header = headerRes.value();
          Session::SessionDataFrame::VarValues varValues{};
          varValues.set_index(headerIndex);
          varValues.set_count(header->count);
          varValues.set_type(Utils::ToSessionDataVarType(header->type));

          for (std::uint32_t valueIndex = 0; valueIndex < header->count; valueIndex++) {
            auto varValue = varValues.add_slot();
            switch (header->type) {
              case VarDataType::Bool: {
                if (auto res = sessionClient->getVarBool(headerIndex, valueIndex)) {
                  varValue->set_bool_value(res.value());
                }
                break;
              };
              case VarDataType::Int32: {
                if (auto res = sessionClient->getVarInt(headerIndex, valueIndex)) {
                  varValue->set_int32_value(res.value());
                }
                break;
              };
              case VarDataType::Bitmask: {
                if (auto res = sessionClient->getVarInt(headerIndex, valueIndex)) {
                  varValue->set_bitmask_value(res.value());
                }
                break;
              };
              case VarDataType::Char: {
                if (auto res = sessionClient->getVarInt(headerIndex, valueIndex)) {
                  varValue->set_char_value(res.value());
                }
                break;
              };
              case VarDataType::Float: {
                if (auto res = sessionClient->getVarFloat(headerIndex, valueIndex)) {
                  varValue->set_float_value(res.value());
                }
                break;
              };
              case VarDataType::Double: {
                if (auto res = sessionClient->getVarDouble(headerIndex, valueIndex)) {
                  varValue->set_double_value(res.value());
                }
                break;
              };

            }
          }
          (*dataVarValues)[headerIndex] = varValues;
        }
        if (L->should_log(spdlog::level::debug)) L->debug("DataFrame: {}", dataFrame.DebugString());
        msg.set_event_type(RPC::Events::SESSION_EVENT_TYPE_DATA_FRAME);
        msg.mutable_payload()->PackFrom(dataFrame);
        return true;
      }
    }
  }

  IRacingIPCServer::Client::Client(const IPC::NamedPipeServer::ConnectionPtr& connection) : id(connection->id()),
    connectionRef(connection) {
    L->debug("Created Client(id={})", id);
  }

  IPC::NamedPipeServer::ConnectionPtr IRacingIPCServer::Client::getConnection() {
    return connectionRef.lock();
  }

  IRacingIPCServer::IRacingIPCServer(const std::shared_ptr<SessionDataProvider>& dataProvider)
    : IRacingIPCServer(dataProvider, Options{}) {

  }

  IRacingIPCServer::IRacingIPCServer(const std::shared_ptr<SessionDataProvider>& dataProvider, const Options& options)
    : dataProvider_(dataProvider),
      dataProviderUnsubscribe_(
        dataProvider->subscribe(
          [this](
          Models::RPC::Events::SessionEventType eventType,
          const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
          const std::shared_ptr<SessionDataProvider>& sessionDataProvider
        ) {
            onSessionEvent(eventType, sessionClientProvider, sessionDataProvider);
          }
        )
      ),
      options_(options),
      namedPipeServerName_(IPC::NextNamedPipeServerName(IRACING_IPC_SERVER_PIPE_NAME)),
      namedPipeServer_(
        IPC::NamedPipeServer::Create(
          namedPipeServerName_,
          std::bind(
            &IRacingIPCServer::handleNamedPipeMessage,
            this,
            std::placeholders::_1,
            std::placeholders::_2,
            std::placeholders::_3,
            std::placeholders::_4,
            std::placeholders::_5
          )
        )
      ) {

#pragma region All event & request handlers
    clientMessageEventHandlerMap_ = {
      {RPC::Events::SessionEventType::SESSION_EVENT_TYPE_DATA_FRAME, &EventHandlers::OnSessionDataFrame}
    };


    clientMessageRequestHandlerMap_ = {
      {IRacingIPCMessageType::TYPE_SET_CLIENT_METADATA, &RequestHandlers::OnSetClientMetadata},
      {IRacingIPCMessageType::TYPE_GET_DATA_PROVIDER_ID, &RequestHandlers::OnGetDataProviderId},
      {IRacingIPCMessageType::TYPE_GET_SESSION_METADATA, &RequestHandlers::OnGetSessionMetadata},
      {IRacingIPCMessageType::TYPE_GET_SESSION_DATA_HEADERS, &RequestHandlers::OnGetSessionDataHeaders},
      {IRacingIPCMessageType::TYPE_SET_SUBSCRIPTIONS, &RequestHandlers::OnSetSubscriptions},
    };
#pragma endregion

#pragma region Named Pipe Server Event Handlers
    namedPipeServer_->events.onConnect.subscribe(
      [&](IPC::NamedPipeServer::ConnectionId id, IPC::NamedPipeServer::ConnectionPtr connection) {
        auto clientMap = clientMap_.mutate();

        if (clientMap->contains(id)) {
          L->warn("Client({}) is already registered", id);
          return;
        }

        clientMap->insert_or_assign(id, std::make_shared<Client>(connection));
      }
    );

    namedPipeServer_->events.onDisconnect.subscribe(
      [&](IPC::NamedPipeServer::ConnectionId id, IPC::NamedPipeServer::ConnectionWeakPtr connection) {
        auto clientMap = clientMap_.mutate();
        if (!clientMap->contains(id)) {
          L->warn("Client({}) is not registered", id);
          return;
        }

        clientMap->erase(id);
      }
    );
#pragma endregion
  }

  void IRacingIPCServer::handleNamedPipeMessage(
    std::size_t size,
    IPC::NamedPipeServer::MessageDataType data,
    const IPC::NamedPipeMessageHeader* header,
    std::shared_ptr<IPC::NamedPipeConnection> connection,
    std::shared_ptr<IPC::NamedPipeServer> server
  ) {
    L->debug(
      "Connection({}).onMessage(clientId={},messageId={},messageSourceId={},size={})",
      connection->id(),
      header->clientId,
      header->id,
      header->sourceId,
      size
    );
    RPC::IR::IRacingIPCMessage requestMessage{};
    RPC::IR::IRacingIPCMessage responseMessage{};
    auto clientMap = clientMap_.readonly();
    auto connectionId = connection->id();
    auto client = clientMap->contains(connectionId) ? clientMap->at(connectionId) : nullptr;
    if (!client) {
      L->error("Client({}) is not registered", connectionId);
      return;
    }

    /**
     * Send response message to client
     */
    auto sendResponse = [&] {
      auto writeRes = WriteMessageToConnection(&responseMessage, client, header->id);
      if (!writeRes) {
        L->error("Failed to send response message to client(id={}): {}", client->id, writeRes.error().what());
      }
    };

    /**
     * Send error response
     */
    auto sendResponseError = [&](const std::string& errorStr) {
      L->error(errorStr);
      IRacingIPCError errorMsg{};
      errorMsg.set_code(std::string{magic_enum::enum_name(ErrorCode::General)});
      errorMsg.set_message(errorStr);
      responseMessage.set_is_error(true);
      responseMessage.mutable_payload()->PackFrom(errorMsg);
      sendResponse();
    };

    if (!requestMessage.ParseFromArray(data, size)) {
      sendResponseError(std::format("Failed to parse request message from client(id={})", client->id));
      return;
    }

    auto messageType = requestMessage.type();
    responseMessage.set_type(messageType);

    if (!clientMessageRequestHandlerMap_.contains(messageType)) {
      sendResponseError(
        std::format("Unable to find handler for message type {}", std::string{magic_enum::enum_name(messageType)})
      );
      return;
    }

    auto requestRes = clientMessageRequestHandlerMap_[messageType](
      shared_from_this(),
      dataProvider_->clientProvider(),
      dataProvider_,
      client,
      requestMessage,
      responseMessage
    );
    if (!requestRes) {
      sendResponseError(std::format("Failed to handle request message: {}", requestRes.error().what()));
      return;
    }

    L->info("Successfully handled request message: {}", std::string{magic_enum::enum_name(messageType)});
    sendResponse();
    L->info("Successfully sent response message: {}", std::string{magic_enum::enum_name(messageType)});
  }

  std::expected<bool, IRacingSDK::GeneralError> IRacingIPCServer::start() {
    // Start the named pipe server with a callback that processes messages
    if (!namedPipeServer_->start()) {
      return std::unexpected(
        IRacingSDK::GeneralError::create<IRacingSDK::GeneralError>(
          ErrorCode::General,
          "Failed to start named pipe server with name: {}",
          namedPipeServerName_
        )
      );
    }
    return true;
  }

  std::optional<IRacingSDK::GeneralError> IRacingIPCServer::destroy() {
    if (namedPipeServer_) {
      namedPipeServer_->stop();
      namedPipeServer_.reset();
    }

    dataProviderUnsubscribe_();
    dataProvider_.reset();

    return std::nullopt;
  }

  IPC::Envelope IRacingIPCServer::execute(const IPC::Envelope& messageIn) {
    if (!messageIn) {
      auto errorEnvelope = std::make_shared<Models::RPC::Envelope>();
      errorEnvelope->set_status(RPC::Envelope_Status_STATUS_ERROR);
      errorEnvelope->set_error_details("Invalid input message");
      return errorEnvelope;
    }

    // Create response envelope
    auto messageOut = std::make_shared<Models::RPC::Envelope>();
    messageOut->set_id(messageIn->id());
    messageOut->set_source_id(messageIn->source_id());
    messageOut->set_path(messageIn->path());
    messageOut->set_status(RPC::Envelope_Status_STATUS_DONE);

    std::lock_guard<std::mutex> lock(routesMutex_);

    // Find matching route
    for (const auto& route : routes_) {
      if (route->accepts(messageIn->path())) {
        auto result = route->execute(messageIn, messageOut);
        if (!result) {
          messageOut->set_status(RPC::Envelope::STATUS_ERROR);
          messageOut->set_error_details(result.error().what());
        }
        return messageOut;
      }
    }

    // No matching route found
    messageOut->set_status(Models::RPC::Envelope::STATUS_ERROR);
    messageOut->set_error_details("No matching route found for path: " + messageIn->path());
    return messageOut;
  }

  void IRacingIPCServer::addRoute(const std::shared_ptr<IPC::NamedPipeServerRoute>& route) {
    if (!route) {
      return;
    }

    std::lock_guard<std::mutex> lock(routesMutex_);
    routes_.push_back(route);
  }

  void IRacingIPCServer::setClientMetadata(
    std::uint32_t id,
    const std::shared_ptr<RPC::IR::IRacingIPCClientMetadata>& metadata
  ) {
    auto clientMap = clientMap_.mutate();
    if (!clientMap->contains(id)) {
      L->warn("Client(id={}) not found, unable to set metadata", id);
      return;
    }

    clientMap->at(id)->metadata = metadata;
  }

  std::shared_ptr<RPC::IR::IRacingIPCClientMetadata> IRacingIPCServer::getClientMetadata(std::uint32_t id) {
    auto clientMap = clientMap_.readonly();
    if (!clientMap->contains(id)) {
      L->warn("Client(id={}) not found, unable to get metadata", id);
      return nullptr;
    }

    return clientMap->at(id)->metadata;
  }

  void IRacingIPCServer::onSessionEvent(
    Models::RPC::Events::SessionEventType eventType,
    const std::shared_ptr<IRacingSDK::ClientProvider>& sessionClientProvider,
    const std::shared_ptr<SessionDataProvider>& dataProvider
  ) {
    std::vector<std::pair<ClientPtr, IPC::NamedPipeServer::ConnectionPtr>> clientConnections{};
    {
      auto clientMap = clientMap_.mutate();
      std::vector<IPC::NamedPipeServer::ConnectionId> badConnectionIds{};
      for (const auto& [id, client] : *clientMap) {
        L->debug("Forwarding session event to client(id={})", client->id);
        auto connection = client->connectionRef.lock();
        if (!connection) {
          L->warn("Invalid client(id={}), removing after emit", client->id);
          badConnectionIds.push_back(id);
          continue;
        }

        if (!std::ranges::contains(client->subscribedEvents, eventType)) {
          L->debug(
            "Skipping event emit to client(id={}), it is not subscribed to {}",
            client->id,
            std::string{magic_enum::enum_name<RPC::Events::SessionEventType>(eventType)}
          );
          continue;
        }

        L->debug(
          "Emit session event ({}) to client(id={})",
          std::string{magic_enum::enum_name<RPC::Events::SessionEventType>(eventType)},
          client->id
        );
        clientConnections.emplace_back(client, connection);
      }

      std::ranges::for_each(
        badConnectionIds,
        [&](auto id) {
          clientMap->erase(id);
        }
      );

    }

    auto metadata = dataProvider->getSessionMetadata();

    IRacingIPCMessage msg{};
    msg.set_type(IRacingIPCMessageType::TYPE_EVENT);
    if (eventType == RPC::Events::SESSION_EVENT_TYPE_METADATA_CHANGED || (eventType ==
      RPC::Events::SESSION_EVENT_TYPE_SESSION_CHANGED && metadata)) {
      if (!metadata) {
        L->warn("METADATA_CHANGED event occurred, but metadata is null");
        return;
      }
      msg.set_event_type(eventType);
      msg.mutable_payload()->PackFrom(*metadata.get());
    }

    for (auto& [client, connection] : clientConnections) {

      if (clientMessageEventHandlerMap_.contains(eventType)) {
        L->debug(
          "Invoking client message event handler for event type {}",
          std::string{magic_enum::enum_name<RPC::Events::SessionEventType>(eventType)}
        );
        auto res = clientMessageEventHandlerMap_[eventType](
          eventType,
          sessionClientProvider,
          dataProvider,
          client,
          msg
        );
        if (!res) {
          L->error(
            "Failed to handle event type {} for client(id={}): {}",
            std::string{magic_enum::enum_name<RPC::Events::SessionEventType>(eventType)},
            client->id,
            res.error().what()
          );
          // TODO: Should we break/continue/ignore the error?
          // continue;
        }
      } else {
        L->debug(
          "Client message event handler for event type {} not found, skipping",
          std::string{magic_enum::enum_name<RPC::Events::SessionEventType>(eventType)}
        );
      }


      // WRITE DATA HERE
      L->debug("Writing message to client(id={})", client->id);

      std::vector<char> msgBuffer(msg.ByteSizeLong());
      msg.SerializeToArray(msgBuffer.data(), msgBuffer.size());
      auto writeRes = connection->writeMessage(
        NextMessageId(),
        0,
        reinterpret_cast<const IPC::DynamicByteBuffer::ValueType*>(msgBuffer.data()),
        msgBuffer.size()
      );

      if (!writeRes) {
        L->error("Failed to send message to client(id={}): {}", client->id, writeRes.error().what());
      }
    }
  }

  std::string IRacingIPCServer::getNamedPipePath() const {
    return namedPipeServerName_;
  }

} // namespace VRKit::Shared::Services
