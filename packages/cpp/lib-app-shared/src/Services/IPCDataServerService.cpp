#include <IRacingTools/Shared/LiveSessionDataProvider.h>
#include <IRacingTools/Shared/Services/IPCDataServerService.h>
#include <IRacingTools/Shared/Utils/ErrorHelpers.h>

namespace IRacingTools::Shared::Services {

  namespace {
    auto L = Logging::GetCategoryWithType<IPCDataServerService>();
  }

  IPCDataServerService::Client::Client(const IPC::NamedPipeServer::ConnectionPtr& connection) : id(connection->id()),
    connection(connection) {
    L->info("Created Client(id={})", id);
  }

  IPCDataServerService::IPCDataServerService(const std::shared_ptr<ServiceContainer>& serviceContainer)
    : IPCDataServerService(serviceContainer, Options{}) {
  }

  IPCDataServerService::IPCDataServerService(
    const std::shared_ptr<ServiceContainer>& serviceContainer,
    const Options& options
  )
    : Service(serviceContainer, PrettyType<IPCDataServerService>{}.name()),
      options_(options) {
  }

  std::expected<bool, IRacingSDK::GeneralError> IPCDataServerService::init() {
    namedPipeServer_ = IPC::NamedPipeServer::Create(
      IPC_DATA_SERVER_PIPE_NAME,
      [&](
      std::size_t size,
      const IPC::NamedPipeServer::MessageDataType data,
      auto header,
      std::shared_ptr<IPC::NamedPipeConnection> connection,
      std::shared_ptr<IPC::NamedPipeServer> _server
    ) {
        std::string payload(reinterpret_cast<const char*>(data), size);
        L->debug(
          "Connection({}).onMessage(clientId={},messageId={},messageSourceId={}): {}",
          connection->id(),
          header->clientId,
          header->id,
          header->sourceId,
          payload
        );
      }
    );

    namedPipeServer_->events.onConnect.subscribe(
      [&](IPC::NamedPipeServer::ConnectionId id, IPC::NamedPipeServer::ConnectionPtr connection) {
        std::scoped_lock lock(clientMutex_);
        if (clientMap_.contains(id)) {
          L->warn("Client({}) is already registered", id);
          return;
        }

        clientMap_[id] = std::make_shared<Client>(connection);
      }
    );

    namedPipeServer_->events.onDisconnect.subscribe(
      [&](IPC::NamedPipeServer::ConnectionId id, IPC::NamedPipeServer::ConnectionWeakPtr connection) {
        std::scoped_lock lock(clientMutex_);
        if (!clientMap_.contains(id)) {
          L->warn("Client({}) is not registered", id);
          return;
        }

        clientMap_.erase(id);
      }
    );
    return true;
  }

  std::expected<bool, IRacingSDK::GeneralError> IPCDataServerService::start() {
    if (!namedPipeServer_) {
      return LogAndReturnGeneralError("Named pipe server not initialized");
    }

    // Start the named pipe server with a callback that processes messages
    namedPipeServer_->start();

    return true;
  }

  std::expected<bool, IRacingSDK::GeneralError> IPCDataServerService::start(
    const std::shared_ptr<SessionDataProvider>& dataProvider
  ) {
    auto res = setDataProvider(dataProvider);
    if (!res) {
      return std::unexpected(res.error());
    }

    return start();
  }

  void IPCDataServerService::removeDataProvider() {
    std::scoped_lock lock(dataMutex_);
    if (!dataProvider_) {
      return;
    }

    dataProvider_->stop();

    if (dataProviderUnsubscribe_) {
      dataProviderUnsubscribe_.value()();
      dataProviderUnsubscribe_.reset();
    }

    dataProvider_.reset();
  }

  std::expected<bool, IRacingSDK::GeneralError> IPCDataServerService::setDataProvider(
    const std::shared_ptr<SessionDataProvider>& dataProvider
  ) {
    std::scoped_lock lock(dataMutex_);
    if (!dataProvider) {
      return LogAndReturnGeneralError("No data provider specified");
    }

    if (dataProvider->isLive() && dataProvider_ && dataProvider_->isLive()) {
      return LogAndReturnGeneralError(
        "LiveSessionDataProvider is already set & active, only a DiskSessionDataProvider can replace it"
      );
    }

    removeDataProvider();

    dataProvider_ = dataProvider;

    dataProviderUnsubscribe_ = dataProvider_->subscribe(
      [this](
      Models::RPC::Events::SessionEventType eventType,
      std::shared_ptr<Models::RPC::Events::SessionEventData> eventData
    ) {
        onSessionEvent(eventType, eventData);
      }
    );

    if (!dataProvider_->start()) {
      removeDataProvider();
      return LogAndReturnGeneralError("Failed to start new datasource");
    }

    return true;
  }

  std::optional<IRacingSDK::GeneralError> IPCDataServerService::destroy() {
    if (namedPipeServer_) {
      namedPipeServer_->stop();
      namedPipeServer_.reset();
    }

    removeDataProvider();

    return std::nullopt;
  }

  IPC::Envelope IPCDataServerService::execute(const IPC::Envelope& messageIn) {
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

  void IPCDataServerService::addRoute(const std::shared_ptr<IPC::NamedPipeServerRoute>& route) {
    if (!route) {
      return;
    }

    std::lock_guard<std::mutex> lock(routesMutex_);
    routes_.push_back(route);
  }

  void IPCDataServerService::onSessionEvent(
    Models::RPC::Events::SessionEventType eventType,
    const std::shared_ptr<Models::RPC::Events::SessionEventData>& eventData
  ) {
    std::scoped_lock lock(namedPipeServerMutex_);
    if (!namedPipeServer_) {
      L->warn("Named pipe server has not yet started");
      return;
    }

    // namedPipeServer_->wr

  }

} // namespace IRacingTools::Shared::Services
