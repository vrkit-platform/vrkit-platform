/**
 * @file NamedPipeServer.h
 * @brief Asynchronous named pipe server implementation for Windows IPC
 * @author jglanz
 * @date 4/14/2025
 *
 * This file provides classes and utilities for implementing an asynchronous 
 * Windows named pipe server with support for multiple concurrent connections,
 * message-based communication, and non-blocking I/O operations.
 */

#pragma once

#include <deque>
#include <expected>
#include <functional>
#include <windows.h>

#include <memory>
#include <mutex>
#include <optional>
#include <thread>
#include <IRacingSDK/Utils/EventEmitter.h>
#include <IRacingTools/Shared/IPC/NamedPipeBuffer.h>
#include <IRacingTools/Shared/IPC/NamedPipeErrorTypes.h>
#include <IRacingTools/Shared/IPC/NamedPipeConstants.h>
#include <IRacingTools/Shared/IPC/NamedPipeConnection.h>
#include <IRacingTools/Shared/IPC/NamedPipeMessage.h>
#include <IRacingTools/Shared/Utils/Win32Helpers.h>

namespace IRacingTools::Shared::IPC {
  using namespace IRacingSDK;

  using NamedPipeMessageDataType = DynamicByteBuffer::ValueType *;

  /**
   * @brief Function type for handling received messages
   *
   * Called when a complete message is received from a client.
   */
  using NamedPipeMessageHandler = std::function<void(
    std::size_t size,
    const NamedPipeMessageDataType data,
    const NamedPipeMessageHeader* header,
    std::shared_ptr<NamedPipeConnection> connection,
    std::shared_ptr<NamedPipeServer> server
  )>;

  /**
   * @brief Configuration options for the NamedPipeServer
   */
  struct NamedPipeServerOptions {

    /**
     * @brief Maximum number of concurrent connections
     *
     * 0 = unlimited
     */
    std::size_t maxConnections{NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT};

    /**
     * @brief Size of an individual packet (1..n packets make a message)
     */
    std::size_t packetSize{NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT};

    /**
     * @brief Constructs server options with optional overrides
     *
     * @param overrideOptions Optional options to override defaults
     */
    explicit NamedPipeServerOptions(const std::optional<NamedPipeServerOptions>& overrideOptions = std::nullopt);
  };

  /**
   * @brief Server for managing named pipe connections
   *
   * Handles the creation and management of multiple named pipe connections,
   * processes incoming and outgoing messages, and maintains the server state.
   */
  class NamedPipeServer : public std::enable_shared_from_this<NamedPipeServer> {
    struct Private {
      explicit Private() = default;
    };

    /** @brief Event handle signaled when the server should stop */
    HANDLE stopEventHandle_{CreateManualResetEvent()};

    /** @brief Event handle for notifying the I/O thread of pending events */
    HANDLE ioThreadNotifyEvent_{CreateManualResetEvent()};

    /** @brief Mutex for protecting server state */
    std::mutex mutex_{};

    /** @brief Mutex for protecting connection list */
    std::mutex connectionMutex_{};

    /** @brief Mutex for protecting message emission */
    std::mutex emitMutex_{};

    /** @brief Condition variable for coordinating message emission */
    std::condition_variable emitCondition_{};

    /** @brief Condition variable for coordinating server stopping */
    std::condition_variable stoppedCondition_{};

    /** @brief Queue of messages waiting to be emitted */
    std::deque<MessagePtr> emitMessageQueue_{};

    /** @brief Thread for emitting messages */
    std::unique_ptr<std::thread> emitThread_{nullptr};

    /** @brief Thread for handling I/O operations */
    std::unique_ptr<std::thread> ioThread_{nullptr};

    /** @brief Flag indicating if the server is running */
    std::atomic_bool running_{false};

    /** @brief List of active connections */
    std::vector<std::shared_ptr<NamedPipeConnection>> connections_{};

    /** @brief Handler for processing received messages */
    NamedPipeMessageHandler messageHandler_;

    /** @brief Configuration options for the server */
    const NamedPipeServerOptions options_;

    /** @brief Full path to the named pipe */
    const std::string pipePath_;

  public:
    using ConnectionId = NamedPipeConnection::IdType;

    using Connection = NamedPipeConnection;
    using ConnectionPtr = std::shared_ptr<NamedPipeConnection>;
    using ConnectionWeakPtr = std::weak_ptr<NamedPipeConnection>;

    using MessageDataType = NamedPipeMessageDataType;

    static std::shared_ptr<NamedPipeServer> Create(
      const std::string& pipeName,
      NamedPipeMessageHandler messageHandler,
      const std::optional<NamedPipeServerOptions>& overrideOptions = std::nullopt
    );

    struct {
      Utils::EventEmitter<NamedPipeErrorCode,std::exception> onError{};
      Utils::EventEmitter<Connection::IdType,ConnectionPtr> onConnect{};
      Utils::EventEmitter<Connection::IdType,ConnectionWeakPtr> onDisconnect{};
    } events;

    /**
     * @brief Default constructor is deleted
     */
    NamedPipeServer() = delete;

    /**
     * @brief Copy constructor is deleted
     */
    NamedPipeServer(const NamedPipeServer& other) = delete;

    /**
     * @brief Move constructor is deleted
     */
    NamedPipeServer(NamedPipeServer&& other) noexcept = delete;

    /**
       * @brief Constructs a new NamedPipeServer
       *
       * @param pipeName descriptive name to use for the pipe path
       * @param messageHandler Handler for processing received messages
       * @param overrideOptions Optional configuration overrides
       */
    explicit NamedPipeServer(
      Private,
      const std::string& pipeName,
      NamedPipeMessageHandler messageHandler,
      const std::optional<NamedPipeServerOptions>& overrideOptions = std::nullopt
    );


    /**
     * @brief Copy assignment operator is deleted
     */
    NamedPipeServer& operator=(const NamedPipeServer& other) = delete;

    /**
     * @brief Move assignment operator is deleted
     */
    NamedPipeServer& operator=(NamedPipeServer&& other) noexcept = delete;


    /**
     * @brief Destructor that ensures server is stopped
     */
    virtual ~NamedPipeServer();

    /**
     * @brief Returns the configured packet size for this server
     *
     * The packet size determines the maximum amount of data that can be
     * transferred in a single I/O operation.
     *
     * @return The packet size in bytes
     */
    std::size_t packetSize() const;

    /**
     * @brief Closes and removes a specific connection
     *
     * Terminates the connection with the given ID, releasing all associated
     * resources and removing it from the server's connection list.
     *
     * @param connectionId The unique identifier of the connection to close
     */
    void closeConnection(std::uint32_t connectionId);

    /**
     * @brief Closes and removes a specific connection
     *
     * Terminates the connection with the given ID, releasing all associated
     * resources and removing it from the server's connection list.
     *
     * @param connection The unique identifier of the connection to close
     */
    void closeConnection(const ConnectionPtr& connection);

    /**
     * @brief Checks if there are any available connections
     *
     * A connection is considered available if it exists in the connection list
     * and is fully initialized.
     *
     * @return true if at least one connection is available, false otherwise
     */
    bool hasAvailableConnection();

    /**
     * @brief Determines if a new connection should be created
     *
     * Evaluates if the server should create a new connection based on
     * the current number of connections and the maximum allowed.
     *
     * @return true if a new connection should be created, false otherwise
     */
    bool shouldCreateConnection();

    /**
     * @brief Notifies the I/O thread about pending operations
     *
     * Signals the I/O thread to wake up and process pending operations,
     * such as new connections or data to be read/written.
     */
    void ioThreadNotify();

    /**
     * @brief Writes a message to a specific connection
     *
     * Creates and queues a message to be sent to the client with the
     * specified connection ID.
     *
     * @param connectionId The unique identifier of the target connection
     * @param id The message identifier
     * @param sourceId The source message identifier (for responses)
     * @param data Pointer to the message data
     * @param size Size of the message data in bytes
     * @return Success status or exception if an error occurred
     */
    std::expected<bool, std::exception> writeMessage(
      std::uint32_t connectionId,
      std::uint32_t id,
      std::uint32_t sourceId,
      const DynamicByteBuffer::ValueType* data,
      std::uint32_t size
    );

    /**
     * @brief Starts the server
     *
     * Initializes the server's resources, creates the initial set of pipe connections,
     * and starts the I/O and message emitter threads for processing client communication.
     *
     * @param wait If true, blocks until the server is fully started; if false, returns immediately
     * @return true if server started successfully or was already running, false otherwise
     */
    bool start(bool wait = false);

    /**
     * @brief Checks if the server is currently running
     *
     * A server is considered running when its I/O thread is active and
     * it's ready to accept and process client connections.
     *
     * @return true if the server is running, false otherwise
     */
    bool isRunning();

    /**
     * @brief Stops the server
     *
     * Signals all running threads to stop, closes all active connections,
     * and releases associated resources. Once stopped, the server must be
     * recreated to be started again.
     */
    void stop();

    /**
     * @brief Blocks the calling thread until the server has completely stopped
     *
     * This method can be called after stop() to ensure that all server resources
     * have been properly cleaned up before proceeding.
     */
    void waitUntilStopped();

    /**
     * @brief Retrieves a connection by its ID
     *
     * @param connectionId The unique identifier of the connection to retrieve
     * @return A shared pointer to the connection if found, nullptr otherwise
     */
    std::shared_ptr<NamedPipeConnection> getConnection(std::uint32_t connectionId);

  protected:

    friend class NamedPipeConnection;

    /**
     * @brief Emits a message to be handled by the registered message handler
     *
     * Adds the message to the emission queue and notifies the emit thread
     * to process it.
     *
     * @param message The message to be emitted
     */
    void emitMessage(const std::shared_ptr<NamedPipeMessage>& message);

  private:

    /**
     * @brief I/O thread main function
     *
     * Continuously monitors for and processes I/O operations on all connections,
     * including accepting new connections and handling read/write operations.
     */
    void ioRunnable();

    /**
     * @brief Emit thread main function
     *
     * Continuously processes messages from the emit queue and delivers them
     * to the registered message handler.
     */
    void emitRunnable();

    /**
     * @brief Retrieves the next message to be emitted
     *
     * Gets the next message from the emission queue if one is available.
     *
     * @return An optional containing the next message, or empty if the queue is empty
     */
    std::optional<MessagePtr> nextEmitMessage();

    /**
     * @brief Creates a new pipe connection
     *
     * Initializes a new named pipe instance and creates a corresponding connection object.
     *
     * @return A success result containing the new connection, or an exception if creation failed
     */
    std::expected<std::shared_ptr<NamedPipeConnection>, std::exception> createNewConnection();
  };
} // namespace IPC
