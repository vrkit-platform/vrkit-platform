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
#include <thread>
#include <spdlog/spdlog.h>
#include <magic_enum/magic_enum.hpp>
#include <IRacingSDK/Utils/EventEmitter.h>
#include <VRKit/Shared/IPC/NamedPipeBuffer.h>
#include <VRKit/Shared/IPC/NamedPipeHelpers.h>
#include <VRKit/Shared/IPC/NamedPipeMessage.h>
#include <VRKit/Shared/IPC/NamedPipeIO.h>
#include <VRKit/Shared/IPC/ObjectPool.h>
#include <VRKit/Shared/Utils/Win32Helpers.h>

namespace VRKit::Shared::IPC {
  using namespace IRacingSDK;


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
    NamedPipeMessage* operator()();
  };

  /**
   * @brief Manages a single named pipe connection
   *
   * Handles the reading, writing, and connection state for a single client
   * connection to the named pipe server.
   */
  class NamedPipeConnection : public std::enable_shared_from_this<NamedPipeConnection> {
    struct Private {
      explicit Private() = default;
    };

  public:
    using IdType = std::uint32_t;
    using Ptr = std::shared_ptr<NamedPipeConnection>;
    using WeakPtr = std::weak_ptr<NamedPipeConnection>;

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
    ObjectPool<NamedPipeMessage> messagePool_;

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

    static std::shared_ptr<NamedPipeConnection> Create(
      NamedPipeServer* server,
      HANDLE pipeHandle,
      std::size_t packetSize
    );

    /**
     * @brief Establishes a connection with a client
     *
     * @return Success status or exception if error occurred
     */
    std::expected<bool, std::exception> connect();

    /**
           * @brief Constructs a new NamedPipeConnection
           *
           * @param server The server that owns this connection
           * @param pipeHandle Handle to the named pipe
           * @param packetSize Size of individual packets for this connection
           */
    explicit NamedPipeConnection(Private, NamedPipeServer* server, HANDLE pipeHandle, std::size_t packetSize);

    /**
     * @brief Default constructor is deleted
     */
    NamedPipeConnection() = delete;


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
}

