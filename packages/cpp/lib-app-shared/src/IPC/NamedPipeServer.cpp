#include <IRacingTools/Shared/IPC/NamedPipeServer.h>
#include <IRacingTools/Shared/Utils/Win32Helpers.h>

#include <algorithm>
#include <format>
#include <ranges>

namespace IRacingTools::Shared::IPC {
namespace {
  auto L = Logging::GetCategoryWithType<NamedPipeServer>();
}
  NamedPipeServerOptions::NamedPipeServerOptions(const std::optional<NamedPipeServerOptions>& overrideOptions) {
    if (overrideOptions) {
      auto options = overrideOptions.value();

      if (options.maxConnections > 0) {
        maxConnections = options.maxConnections;
      }

      if (options.packetSize > 0) {
        packetSize = options.packetSize;
      }
    }
  }

  std::shared_ptr<NamedPipeServer> NamedPipeServer::Create(
    const std::string& pipeName,
    NamedPipeMessageHandler messageHandler,
    const std::optional<NamedPipeServerOptions>& overrideOptions
  ) {
    return std::make_shared<NamedPipeServer>(NamedPipeServer::Private{}, pipeName, messageHandler, overrideOptions);
  }

  NamedPipeServer::NamedPipeServer(
    Private,
    const std::string& pipeName,
    NamedPipeMessageHandler messageHandler,
    const std::optional<NamedPipeServerOptions>& overrideOptions
  ) : messageHandler_(messageHandler),
      options_(overrideOptions),
      pipePath_(CreateNamedPipePath(pipeName)) {

    assert(options_.packetSize >= MessageHeaderSize);
    L->info("NamedPipeServer({}) Created", pipePath_);
  }

  NamedPipeServer::~NamedPipeServer() {
    stop();

    {
      std::lock_guard lock(mutex_);
      if (stopEventHandle_) CloseHandle(stopEventHandle_);
    }
    L->info("NamedPipeServer({}) Destroyed", pipePath_);
  }

  std::size_t NamedPipeServer::packetSize() const {
    return options_.packetSize;
  }

  std::string NamedPipeServer::pipePath() const {
    return pipePath_;
  }

  void NamedPipeServer::closeConnection(std::uint32_t connectionId) {
    auto connection = getConnection(connectionId);
    std::scoped_lock lock(mutex_);
    if (!connection) {
      L->warn("No connection has id={}", connectionId);
      return;
    }

    auto eraseCount = std::erase_if(
      connections_,
      [connectionId](auto& it) {
        return it->id() == connectionId;
      }
    );

    L->debug("Removed ({}) connections id={}", eraseCount, connectionId);
  }

  void NamedPipeServer::closeConnection(const ConnectionPtr& connection) {
    closeConnection(connection->id());
    events.onDisconnect.publish(connection->id(), connection);
  }

  /**
   * @inherit
   */
  bool NamedPipeServer::start(bool wait) {
    {
      std::scoped_lock lock(mutex_);

      if (ioThread_ || isRunning() || running_.exchange(true)) {
        if (ioThread_) {
          L->warn("NamedPipeServer can not be re-started");
        }
        return false;
      }

      ioThread_ = std::make_unique<std::thread>(&NamedPipeServer::ioRunnable, this);
      emitThread_ = std::make_unique<std::thread>(&NamedPipeServer::emitRunnable, this);
    }
    if (wait) {
      waitUntilStopped();
    }
    return true;
  }


  bool NamedPipeServer::isRunning() {
    return running_;
  }


  /**
   * Stop the server
   *
   * @return `true` if the operation was successfully stopped, `false` if there was no ongoing operation to stop or if stopping failed
   */
  void NamedPipeServer::stop() {
    {
      std::scoped_lock lock(mutex_);
      if (!running_.exchange(false)) {
        L->warn("NamedPipeServer is invalid or not running, can not stop");
      }

      emitCondition_.notify_all();

      if (ioThread_ && ioThread_->joinable() && ioThread_->get_id() != std::this_thread::get_id()) {
        ioThread_->join();
        ioThread_.reset();
      }

      if (emitThread_ && emitThread_->joinable() && emitThread_->get_id() != std::this_thread::get_id()) {
        emitThread_->join();
        emitThread_.reset();
      }
    }

    stoppedCondition_.notify_all();

  }

  /**
   * Blocks the calling thread until the server is completely stopped.
   *
   * This method acquires a lock and waits for the internal server state
   * to indicate that the server is no longer running. The waiting is
   * based on the condition that `running_`, `ioThread_`, and `emitThread_`
   * are all in a state indicating the server is stopped. It ensures proper
   * synchronization when stopping the server.
   *
   * This function also logs a message when the waiting process completes.
   */
  void NamedPipeServer::waitUntilStopped() {
    {
      std::unique_lock<std::mutex> lock(mutex_);
      if (!isRunning()) return;

      stoppedCondition_.wait(
        lock,
        [&] {
          return !running_ || !ioThread_ || !emitThread_;
        }
      );
    }

    L->info("waitUntilStopped completed");
  }

  std::shared_ptr<NamedPipeConnection> NamedPipeServer::getConnection(std::uint32_t connectionId) {
    std::scoped_lock lock(mutex_);
    for (auto& connection : connections_) {
      if (connection->id() == connectionId) return connection;
    }


    return nullptr;

  }


  bool NamedPipeServer::hasAvailableConnection() {
    return !connections_.empty() && !std::ranges::all_of(
      connections_,
      [](auto& connection) {
        return connection->isConnected();
      }
    );
  }

  bool NamedPipeServer::shouldCreateConnection() {
    auto maxConnections = options_.maxConnections;
    return !hasAvailableConnection() && (maxConnections == 0 || connections_.size() < maxConnections);
  }

  void NamedPipeServer::ioThreadNotify() {
    SetEvent(ioThreadNotifyEvent_);
  }

  /**
   * Write message to a specific connection
   *
   * @param connectionId to write message to
   * @param id of the message
   * @param sourceId of the message
   * @param data pointer to memory
   * @param size amount of data to read from `data`
   * @return Either `std::unexpected<std::exception>` or `bool`
   */
  std::expected<bool, std::exception> NamedPipeServer::writeMessage(
    std::uint32_t connectionId,
    std::uint32_t id,
    std::uint32_t sourceId,
    const DynamicByteBuffer::ValueType* data,
    std::uint32_t size
  ) {
    auto connection = getConnection(connectionId);
    if (!connection) return LogAndReturnRuntimeError("Connection({}) NOT_FOUND", connectionId);

    if (connection->isConnected()) return LogAndReturnRuntimeError("Connection({}) NOT_CONNECTED", connectionId);

    return connection->writeMessage(id, sourceId, data, size);
  }

  /**
   * Main I/O loop for the NamedPipeServer.
   *
   * This function continuously monitors and handles I/O operations for all client connections
   * to the named pipe server. It performs the following tasks:
   * - Handles connection requests by creating new pipe instances.
   * - Manages pending events across all active client connections.
   * - Waits for events to complete using `WaitForMultipleObjects`.
   * - Processes different types of events (Connect, Read, Write) based on their roles.
   *
   * The loop executes until the server is stopped or an unrecoverable error occurs.
   *
   * Detailed functionality:
   * - Creates new connections when requested by `shouldCreateConnection`.
   * - Ensures that a read operation is pending for each active connection.
   * - Aggregates pending events and their associated handles.
   * - Waits for I/O completion events using `WaitForMultipleObjects`.
   * - Processes the completed event and invokes the appropriate handler based on its role:
   *   - **Connect**: Marks a connection as established.
   *   - **Read**: Processes data received and invokes `onRead`.
   *   - **Write**: Acknowledges completion of a write operation.
   *
   * Error handling:
   * - Logs errors related to operations such as creating new connections, starting reads,
   *   and handling I/O results.
   * - Stops the server in case of critical errors.
   *
   * Notes:
   * - Uses `ResetEvent` to reset event handles after they are processed.
   * - Handles indefinite waiting until an event is available.
   * - May encounter unrecoverable errors, in which case it gracefully stops the server.
   */
  void NamedPipeServer::ioRunnable() {

    auto resetIOThreadNotifyEvent = [this] {
      std::lock_guard lock(mutex_);
      ResetEvent(ioThreadNotifyEvent_);
    };
    while (true) {
      if (!running_) {
        break;
      }
      // Create a new pipe instance for each client
      if (shouldCreateConnection()) {
        auto res = createNewConnection();
        if (!res) {
          L->error("createNewConnection Failed: {}", res.error().what());
          break;
        }
      }

      resetIOThreadNotifyEvent();

      // Pending event vectors
      std::vector<NamedPipePendingEvent> allPendingEvents{};
      std::vector<HANDLE> allPendingEventHandles{};

      // Populate the pending event vectors
      for (auto& connection : connections_) {
        // Ensure that if connected, a read is pending
        if (auto res = connection->startRead(); !res.has_value()) {
          L->error("startRead failed: {}", res.error().what());
          closeConnection(connection);
          continue;
        }

        if (auto res = connection->startWrite(); !res.has_value()) {
          L->error("startWrite failed: {}", res.error().what());
          closeConnection(connection->id());
          continue;
        }

        // Get all pendingEvents for the given connection
        auto pendingEvents = connection->pendingEvents();

        // Map to a vector of HANDLE(s), which are `OVERLAPPED.hEvent`
        auto pendingEventHandles = pendingEvents | std::views::transform(
          [](auto& pendingEvent) {
            return std::get<1>(pendingEvent)->overlapped.hEvent;
          }
        );

        // Merge all pending events into `allPendingEvents` & event handles into `allPendingEventHandles`
        allPendingEvents.insert(allPendingEvents.end(), pendingEvents.begin(), pendingEvents.end());
        allPendingEventHandles.insert(
          allPendingEventHandles.end(),
          pendingEventHandles.begin(),
          pendingEventHandles.end()
        );
      }

      if (!allPendingEventHandles.size()) continue;

      // ALWAYS ADD THE IO THREAD NOTIFY EVENT AT THE VERY END
      allPendingEventHandles.push_back(ioThreadNotifyEvent_);

      if (L->should_log(spdlog::level::debug))
        L->debug(
          "Waiting for an event (pendingEvents={},pendingEventHandles={},connections={})",
          allPendingEvents.size(),
          allPendingEventHandles.size(),
          connections_.size()
        );

      auto waitRes = WaitForMultipleObjects(
        allPendingEventHandles.size(),
        allPendingEventHandles.data(),
        // `FALSE` as the 3rd argument, means return on the first fired event
        FALSE,
        // Wait indefinitely
        INFINITE
      );

      // dwWait shows which pipe completed the operation.

      auto idx = waitRes - WAIT_OBJECT_0;
      if (idx == allPendingEventHandles.size() - 1) {
        L->info("ioThreadNotifyEvent_ was triggered");
        resetIOThreadNotifyEvent();
        continue;
      }

      if (idx >= allPendingEvents.size()) {
        L->error("Unknown Error (waitRes={},idx={})", waitRes, idx);
        break;
      }

      auto& pendingEvent = allPendingEvents[idx];
      auto connection = std::get<0>(pendingEvent);
      auto io = std::get<1>(pendingEvent);
      auto role = io->role;
      auto overlappedPtr = &io->overlapped;
      ResetEvent(overlappedPtr->hEvent);

      DWORD byteCount{0};
      auto success = GetOverlappedResult(connection->pipeHandle(), overlappedPtr, &byteCount, FALSE);
      L->info("GetOverlappedResult(success={},byteCount={})", success, byteCount);
      auto err = GetLastError();
      if (!success) {
        switch (err) {
          case ERROR_MORE_DATA:
            break;
          case ERROR_BROKEN_PIPE:
            closeConnection(connection->id());
            break;
          default:
            L->error("ERROR: GetOverlappedResult({}): {}", GetLastError(), GetLastErrorAsString());
            return;
        }

      }
      switch (role) {
        case NamedPipeIO::Role::Connect: {
          L->info("Connect(byteCount={})", byteCount);
          connection->setConnected(true);
          events.onConnect.publish(connection->id(), connection);
          break;
        };
        case NamedPipeIO::Role::Read: {
          // TODO: Populate message
          L->info("Read(byteCount={})", byteCount);
          connection->onRead(byteCount);
          break;
        };
        case NamedPipeIO::Role::Write: {
          // TODO: Pop message and start sending next if available
          L->info("Write(byteCount={})", byteCount);
          connection->onWrite(byteCount);
          break;
        };
      }
    }

    running_.exchange(false);
  }

  void NamedPipeServer::emitRunnable() {
    while (true) {
      if (!running_) {
        break;
      }

      std::shared_ptr<NamedPipeMessage> msg{nullptr};
      {
        auto msgOpt = nextEmitMessage();
        if (!msgOpt) {
          L->warn("No available message, likely shutdown or disconnected");
          continue;
        }

        msg = msgOpt.value();
      }

      auto connection = getConnection(msg->connectionId());
      if (!connection) {
        L->error("Unable to find active connection for id({})", msg->connectionId());
        continue;
      }

      messageHandler_(msg->size(), msg->data(), msg->header(), connection, shared_from_this());
    }

    running_.exchange(false);
  }

  void NamedPipeServer::emitMessage(const std::shared_ptr<NamedPipeMessage>& message) {
    {
      std::lock_guard<std::mutex> lock(emitMutex_);
      emitMessageQueue_.push_back(message);
    }
    emitCondition_.notify_one();
  }

  std::optional<MessagePtr> NamedPipeServer::nextEmitMessage() {
    std::unique_lock<std::mutex> lock(emitMutex_);
    emitCondition_.wait(
      lock,
      [&]() {
        return !emitMessageQueue_.empty() || !running_;
      }
    );

    if (!running_) {
      return std::nullopt;
    }

    if (emitMessageQueue_.empty()) {
      return std::nullopt;
    }

    MessagePtr message = emitMessageQueue_.front();
    emitMessageQueue_.pop_front();
    return message;

  }

  std::expected<std::shared_ptr<NamedPipeConnection>, std::exception> NamedPipeServer::createNewConnection() {
    std::scoped_lock<std::mutex> lock(connectionMutex_);

    HANDLE pipeHandle = CreateNamedPipe(
      pipePath_.c_str(),
      PIPE_ACCESS_DUPLEX | FILE_FLAG_OVERLAPPED,
      PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT,
      // PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
      PIPE_UNLIMITED_INSTANCES,
      NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT,
      NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT,
      5000,
      nullptr
    );

    if (pipeHandle == INVALID_HANDLE_VALUE) {
      return std::unexpected<std::runtime_error>("Failed to create named pipe instance.");
    }

    auto connection = NamedPipeConnection::Create(this, pipeHandle, packetSize());
    auto res = connection->connect();
    if (!res.has_value()) return std::unexpected(res.error());

    connections_.push_back(connection);

    return connection;

  }


}
