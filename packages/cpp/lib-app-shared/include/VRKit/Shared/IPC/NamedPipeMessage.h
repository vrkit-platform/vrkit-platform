/**
 * @file NamedPipeMessage.h
 * @brief Message structures and classes for named pipe IPC communication
 * @author jglanz
 * @date 4/14/2025
 *
 * This file provides message handling structures and classes for Windows named pipe
 * communication, including message headers, data packets, and complete message objects.
 */

#pragma once

#include <atomic>
#include <expected>
#include <memory>
#include <optional>
#include <VRKit/Shared/IPC/NamedPipeBuffer.h>

namespace VRKit::Shared::IPC {

  /**
   * @brief Represents the header structure of a message, which contains metadata such as identifiers and size.
   */
  struct NamedPipeMessageHeader {
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
  constexpr auto MessageHeaderSize = sizeof(NamedPipeMessageHeader);

  /**
   * @brief Type definition for message data packets
   *
   * A pair consisting of a pointer to the data and its size
   */
  using MessageDataPacket = std::pair<DynamicByteBuffer::ValueType*, std::size_t>;

  /**
   * @brief Represents a complete message for named pipe communication
   *
   * A NamedPipeMessage includes both the header metadata and the actual data payload,
   * along with functionality to process, read, and write the message.
   */
  class NamedPipeMessage {
    /** @brief The message header */
    NamedPipeMessageHeader header_{};

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
    NamedPipeMessageHeader* resetHeader();

  public:

    /**
     * @brief Default constructor is deleted
     */
    NamedPipeMessage() = delete;

    /**
     * @brief Constructs a new Message object
     *
     * @param connectionId The connection identifier
     * @param packetSize Size of individual packets for this message
     */
    explicit NamedPipeMessage(const std::uint32_t& connectionId, std::size_t packetSize);

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
    NamedPipeMessage* setError(const std::string& msg);

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
    std::expected<bool, std::exception> setHeader(const NamedPipeMessageHeader& newHeader);

    /**
     * @brief Gets a pointer to the message header
     *
     * @return Pointer to the message header
     */
    NamedPipeMessageHeader* header();

    /**
     * @brief Gets a const pointer to the message header
     *
     * @return Const pointer to the message header
     */
    const NamedPipeMessageHeader* header() const;

    /**
     * @brief Resets the message to its initial state
     *
     * @return Pointer to this message
     */
    NamedPipeMessage* reset();

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
  using MessagePtr = std::shared_ptr<NamedPipeMessage>;

} // namespace VRKit::Shared::IPC
