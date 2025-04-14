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
#include <spdlog/spdlog.h>
#include <magic_enum/magic_enum.hpp>
#include <IRacingTools/Shared/IPC/Buffer.h>
#include <IRacingTools/Shared/IPC/NamedPipeHelpers.h>
#include <IRacingTools/Shared/IPC/ObjectPool.h>
#include <IRacingTools/Shared/IPC/Win32Helpers.h>


/**
 * @def NAMED_PIPE_SERVER_PIPE_NAME_DEFAULT
 * @brief Default name for the named pipe
 */
#ifndef NAMED_PIPE_SERVER_PIPE_NAME_DEFAULT
#define NAMED_PIPE_SERVER_PIPE_NAME_DEFAULT "server_pipe"
#endif

/**
 * @def NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT
 * @brief Default maximum number of connections (0 means unlimited)
 */
#ifndef NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT
#define NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT 0
#endif

/**
 * @def NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT
 * @brief Default buffer size for pipe communication (in bytes)
 */
#ifndef NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT
#define NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT 8192
// #define NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT 20
#endif

namespace IRacingTools::Shared::IPC {

  /**
   * @brief Represents the header structure of a message, which contains metadata such as identifiers and size.
   */
  struct MessageHeader {
    /**
     * @brief Unique message identifier
     * 
     * ID must be unique until rollover & must be > 0
     */
    std::uint32_t id{0};

    /**
     * @brief Reference to a previous message ID
     * 
     * ID this message is related to, i.e. the ID that was sent in the request, if this is a response
     */
    std::uint32_t sourceId{0};

    /**
     * @brief Client identifier
     * 
     * Represents the unique identifier for a client, used to track and manage client-specific operations
     */
    std::uint32_t clientId{0};

    /**
     * @brief Size of message data in bytes
     * 
     * Data size of this message (excluding header size)
     */
    std::uint32_t size{};
  };

  /**
   * @brief Size of the MessageHeader structure in bytes
   */
  constexpr auto MessageHeaderSize = sizeof(MessageHeader);

  /**
   * @brief Type definition for message data packets
   *
   * A pair consisting of a pointer to the data and its size
   */
  using MessageDataPacket = std::pair<DynamicByteBuffer::ValueType*, std::size_t>;

  /**
   * @brief Represents a complete message for named pipe communication
   *
   * A Message includes both the header metadata and the actual data payload,
   * along with functionality to process, read, and write the message.
   */
  class Message {
    /** @brief The message header */
    MessageHeader header_{};

    /** @brief Error that occurred during message processing, if any */
    std::optional<std::exception> error_{std::nullopt};

    /** @brief Flag indicating if the header has been processed */
    std::atomic_bool headerProcessed_{false};

    /** @brief Flag indicating if the header has been written */
    std::atomic_bool headerWritten_{false};

    /** @brief Flag indicating if all data has been read */
    std::atomic_bool allDataRead_{false};

    /** @brief Flag indicating if all data has been written */
    std::atomic_bool allDataWritten_{false};

    /** @brief Buffer for message data */
    DynamicByteBuffer buffer_{};

    /** @brief Available size in the buffer */
    DynamicByteBuffer::SizeType availableSize_{0};

    /** @brief Connection ID associated with this message */
    const std::uint32_t connectionId_;

    /** @brief Size of individual data packets */
    const std::size_t packetSize_;

    protected:

      /**
       * @brief Resets the message header to its default state
       *
       * @return Pointer to the reset header
       */
      MessageHeader* resetHeader();

    public:

      /**
       * @brief Default constructor is deleted
       */
      Message() = delete;

      /**
       * @brief Constructs a new Message object
       *
       * @param connectionId The connection identifier
       * @param packetSize Size of individual packets for this message
       */
      explicit Message(const std::uint32_t& connectionId, std::size_t packetSize);

      /**
       * @brief Gets the message identifier
       *
       * @return Message ID
       */
      std::uint32_t id();

      /**
       * @brief Gets the source message identifier
       *
       * @return Source message ID
       */
      std::uint32_t sourceId();

      /**
       * @brief Gets the connection identifier
       *
       * @return Connection ID
       */
      std::uint32_t connectionId() const;

      /**
       * @brief Gets the packet size for this message
       *
       * @return Packet size in bytes
       */
      std::size_t packetSize() const;

      /**
       * @brief Gets the total size of the message data
       *
       * @return Size in bytes
       */
      std::size_t size();

      /**
       * @brief Checks if the message has an error
       *
       * @return true if an error is present, false otherwise
       */
      bool hasError();

      /**
       * @brief Checks if the header has been processed
       *
       * @return true if header is processed, false otherwise
       */
      bool isHeaderProcessed();

      /**
       * @brief Checks if the header has been written
       *
       * @return true if header is written, false otherwise
       */
      bool isHeaderWritten();

      /**
       * @brief Sets the headerWritten flag to true
       */
      void setHeaderWritten();

      /**
       * @brief Checks if all data has been read
       *
       * @return true if all data has been read, false otherwise
       */
      bool allDataRead();

      /**
       * @brief Processes bytes that have been read
       *
       * @param bytesRead Number of bytes read
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> onRead(std::size_t bytesRead);

      /**
       * @brief Processes bytes that have been written
       *
       * @param bytesWritten Number of bytes written
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> onWrite(std::size_t bytesWritten);

      /**
       * @brief Processes the message header
       *
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> processHeader();

      /**
       * @brief Sets an error for this message
       *
       * @param msg Error message
       * @return Pointer to this message
       */
      Message* setError(const std::string& msg);

      /**
       * @brief Gets the current error if any
       *
       * @return Optional containing exception if error exists
       */
      std::optional<std::exception> error() const;

      /**
       * @brief Sets a new header for this message
       *
       * @param newHeader The header to set
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> setHeader(const MessageHeader& newHeader);

      /**
       * @brief Gets a pointer to the message header
       *
       * @return Pointer to the message header
       */
      MessageHeader* header();

      /**
       * @brief Gets a const pointer to the message header
       *
       * @return Const pointer to the message header
       */
      const MessageHeader* header() const;

      /**
       * @brief Resets the message to its initial state
       *
       * @return Pointer to this message
       */
      Message* reset();

      /**
       * @brief Gets the next packet for reading
       *
       * @return A MessageDataPacket for reading
       */
      MessageDataPacket getNextReadPacket();

      /**
       * @brief Gets the next packet for writing
       *
       * @return A MessageDataPacket for writing
       */
      MessageDataPacket getNextWritePacket();

      /**
       * @brief Gets a pointer to the underlying data
       *
       * @return Data pointer, which is sized to match the header if needed
       */
      DynamicByteBuffer::ValueType* data();

      /**
       * @brief Gets a const pointer to the underlying data
       *
       * @return Const data pointer
       */
      const DynamicByteBuffer::ValueType* data() const;

      /**
       * @brief Sets the data for this message
       *
       * @param data Pointer to the data
       * @param length Length of the data in bytes
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> setData(
        const DynamicByteBuffer::ValueType* data,
        DynamicByteBuffer::SizeType length
      );
  };

  /**
   * @brief Shared pointer to a Message object
   */
  using MessagePtr = std::shared_ptr<Message>;

  /**
   * @brief Handles I/O operations for named pipes
   *
   * Manages the OVERLAPPED structure and I/O state for asynchronous operations.
   */
  struct NamedPipeIO {
    /**
     * @brief Defines the role of the I/O operation
     */
    enum class Role {
      Connect,
      ///< Connecting to a pipe
      Read,
      ///< Reading from a pipe
      Write ///< Writing to a pipe
    };

    /** @brief Connection identifier */
    std::uint32_t id;

    /** @brief Role of this I/O operation */
    Role role;

    /** @brief Windows OVERLAPPED structure for asynchronous I/O */
    OVERLAPPED overlapped{};

    /** @brief Flag indicating if an I/O operation is pending */
    bool hasPendingIO{false};

    /**
     * @brief Constructor for NamedPipeIO
     *
     * @param connectionId The connection identifier
     * @param role The role of this I/O operation
     */
    NamedPipeIO(std::uint32_t connectionId, Role role);

    /**
     * @brief Converts the I/O information to a string
     *
     * @return String representation of this I/O operation
     */
    std::string toString();
  };

  // Forward declarations
  class NamedPipeConnection;
  class NamedPipeServer;

  /**
   * @brief Type for tracking pending pipe events
   *
   * A tuple containing a connection and its associated I/O operation
   */
  using NamedPipePendingEvent = std::tuple<std::shared_ptr<NamedPipeConnection>, NamedPipeIO*>;

  /**
   * @brief Factory for creating Message objects
   */
  struct MessageFactory {
    /** @brief Pointer to the associated server */
    NamedPipeServer* server;

    /** @brief Connection identifier */
    std::uint32_t connectionId;

    /**
     * @brief Constructs a new MessageFactory
     *
     * @param server The server that owns this factory
     * @param connectionId The connection identifier
     */
    MessageFactory(NamedPipeServer* server, std::uint32_t connectionId);

    /**
     * @brief Creates a new Message object
     *
     * @return Pointer to a newly created Message
     */
    Message* operator()();
  };

  /**
   * @brief Manages a single named pipe connection
   *
   * Handles the reading, writing, and connection state for a single client
   * connection to the named pipe server.
   */
  class NamedPipeConnection : public std::enable_shared_from_this<NamedPipeConnection> {
    public:

      /**
       * @brief Creates a Windows event object
       *
       * @return Handle to the created event
       */
      static HANDLE CreateEvent() {
        return ::CreateEvent(nullptr, TRUE, FALSE, nullptr);
      };

    private:

      /** @brief Pointer to the server that owns this connection */
      NamedPipeServer* server_;

      /** @brief Unique identifier for this connection */
      const std::uint32_t id_{NextNamedPipeConnectionId()};

      /** @brief Size of individual packets for this connection */
      const std::size_t packetSize_;

      /** @brief Handle to the Windows named pipe */
      HANDLE pipeHandle_;

      /** @brief Factory for creating messages for this connection */
      MessageFactory messageFactory_;

      /** @brief Pool of reusable message objects */
      ObjectPool<Message> messagePool_;

      /** @brief Flag indicating if the connection is established */
      std::atomic_bool connected_{false};

      /** @brief I/O object for connection operations */
      NamedPipeIO connectIO_{id_, NamedPipeIO::Role::Connect};

      /** @brief I/O object for read operations */
      NamedPipeIO readIO_{id_, NamedPipeIO::Role::Read};

      /** @brief I/O object for write operations */
      NamedPipeIO writeIO_{id_, NamedPipeIO::Role::Write};

      /** @brief Event handle signaled when a write message is queued */
      HANDLE writeMessageQueuedEvent_{CreateManualResetEvent()};

      /** @brief Mutex for protecting the write message queue */
      std::mutex writeMessageQueueMutex_{};

      /** @brief Queue of messages waiting to be written */
      std::deque<MessagePtr> writeMessageQueue_{};

      /** @brief Currently active write message */
      MessagePtr writeMessage_{nullptr};

      /** @brief Currently active read message */
      MessagePtr readMessage_{nullptr};

    public:

      /**
       * @brief Establishes a connection with a client
       *
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> connect();

      /**
       * @brief Default constructor is deleted
       */
      NamedPipeConnection() = delete;

      /**
       * @brief Constructs a new NamedPipeConnection
       *
       * @param server The server that owns this connection
       * @param pipeHandle Handle to the named pipe
       * @param packetSize Size of individual packets for this connection
       */
      explicit NamedPipeConnection(NamedPipeServer* server, HANDLE pipeHandle, std::size_t packetSize);

      /**
       * @brief Destructor that cleans up connection resources
       */
      virtual ~NamedPipeConnection();

      /**
       * @brief Destroys and cleans up this connection
       */
      void destroy();

      /**
       * @brief Gets the packet size for this connection
       *
       * @return Packet size in bytes
       */
      std::size_t packetSize() const;

      /**
       * @brief Gets all pending events for this connection
       *
       * @return Vector of pending events
       */
      std::vector<NamedPipePendingEvent> pendingEvents();

      /**
       * @brief Gets all I/O operations for this connection
       *
       * @return Vector of I/O operation pointers
       */
      std::vector<NamedPipeIO*> allIO();

      /**
       * @brief Gets the connection identifier
       *
       * @return Connection ID
       */
      std::uint32_t id() const;

      /**
       * @brief Gets the pipe handle
       *
       * @return Handle to the named pipe
       */
      HANDLE pipeHandle();

      /**
       * @brief Gets the read I/O operation
       *
       * @return Reference to the read I/O operation
       */
      NamedPipeIO& readIO();

      /**
       * @brief Gets the write I/O operation
       *
       * @return Reference to the write I/O operation
       */
      NamedPipeIO& writeIO();

      /**
       * @brief Gets the connect I/O operation
       *
       * @return Reference to the connect I/O operation
       */
      NamedPipeIO& connectIO();

      /**
       * @brief Checks if the connection is established
       *
       * @return true if connected, false otherwise
       */
      bool isConnected();

      /**
       * @brief Checks if a read operation is pending
       *
       * @return true if a read is pending, false otherwise
       */
      bool isReadPending();

      /**
       * @brief Writes a message to the connection
       *
       * @param id Message identifier
       * @param sourceId Source message identifier
       * @param data Pointer to the data
       * @param size Size of the data in bytes
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> writeMessage(
        std::uint32_t id,
        std::uint32_t sourceId,
        const DynamicByteBuffer::ValueType* data,
        std::uint32_t size
      );

      /**
       * @brief Starts an asynchronous read operation
       *
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> startRead();

      /**
       * @brief Starts an asynchronous write operation
       *
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> startWrite();

      /**
       * @brief Sets the connection state
       *
       * @param connected New connection state
       * @return The new connection state
       */
      bool setConnected(bool connected);

      /**
       * @brief Gets the OVERLAPPED structure for read operations
       *
       * @return Pointer to the read OVERLAPPED structure
       */
      LPOVERLAPPED readOverlapped();

      /**
       * @brief Gets the OVERLAPPED structure for write operations
       *
       * @return Pointer to the write OVERLAPPED structure
       */
      LPOVERLAPPED writeOverlapped();

    protected:

      friend class NamedPipeServer;

      /**
       * @brief Processes bytes that have been read
       *
       * @param bytesRead Number of bytes read
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> onRead(std::size_t bytesRead);

      /**
       * @brief Processes bytes that have been written
       *
       * @param bytesWritten Number of bytes written
       * @return Success status or exception if error occurred
       */
      std::expected<bool, std::exception> onWrite(std::size_t bytesWritten);
  };

  /**
   * @brief Function type for handling received messages
   *
   * Called when a complete message is received from a client.
   */
  using MessageHandler = std::function<void(
    std::size_t size,
    const DynamicByteBuffer::ValueType* data,
    const MessageHeader* header,
    std::shared_ptr<NamedPipeConnection> connection,
    std::shared_ptr<NamedPipeServer> server
  )>;

  /**
   * @brief Configuration options for the NamedPipeServer
   */
  struct NamedPipeServerOptions {
    /**
     * @brief Pipe name to use (excludes \\\\.\\pipe\\)
     */
    std::string pipeName{NAMED_PIPE_SERVER_PIPE_NAME_DEFAULT};

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
    MessageHandler messageHandler_;

    /** @brief Configuration options for the server */
    const NamedPipeServerOptions options_;

    /** @brief Full path to the named pipe */
    const std::string pipePath_;

    public:

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
       * @brief Copy assignment operator is deleted
       */
      NamedPipeServer& operator=(const NamedPipeServer& other) = delete;

      /**
       * @brief Move assignment operator is deleted
       */
      NamedPipeServer& operator=(NamedPipeServer&& other) noexcept = delete;

      /**
       * @brief Constructs a new NamedPipeServer
       *
       * @param messageHandler Handler for processing received messages
       * @param overrideOptions Optional configuration overrides
       */
      explicit NamedPipeServer(
        MessageHandler messageHandler,
        const std::optional<NamedPipeServerOptions>& overrideOptions = std::nullopt
      );

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
      void emitMessage(const std::shared_ptr<Message>& message);

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
