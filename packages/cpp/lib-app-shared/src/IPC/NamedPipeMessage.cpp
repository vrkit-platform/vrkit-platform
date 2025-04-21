#include <IRacingTools/Shared/IPC/NamedPipeServer.h>
#include <IRacingTools/Shared/IPC/NamedPipeHelpers.h>

#include <algorithm>
#include <format>
#include <ranges>

namespace IRacingTools::Shared::IPC {
  NamedPipeMessage::NamedPipeMessage(const std::uint32_t& connectionId, std::size_t packetSize):
    connectionId_(connectionId),
    packetSize_(packetSize) {
  }

  std::uint32_t NamedPipeMessage::id() {
    return header_.id;
  }

  std::uint32_t NamedPipeMessage::sourceId() {
    return header_.sourceId;
  }

  std::uint32_t NamedPipeMessage::connectionId() const {
    return connectionId_;
  }

  bool NamedPipeMessage::hasError() {
    return error_.has_value();
  }

  NamedPipeMessage* NamedPipeMessage::setError(const std::string& msg) {
    error_ = std::make_optional<std::runtime_error>(msg);
    return this;
  }

  bool NamedPipeMessage::isHeaderProcessed() {
    if (headerProcessed_ && (header_.size <= 0 || header_.id <= 0)) {
      headerProcessed_ = false;
    }
    return headerProcessed_;
  }

  bool NamedPipeMessage::isHeaderWritten() {
    return headerWritten_;
  }

  void NamedPipeMessage::setHeaderWritten() {
    headerWritten_ = true;
  }

  bool NamedPipeMessage::allDataRead() {
    return isHeaderProcessed() && allDataRead_;
  }

  std::expected<bool, std::exception> NamedPipeMessage::onRead(std::size_t bytesRead) {
    auto pos = buffer_.writePosition() + bytesRead;
    if (pos > buffer_.size()) {
      return LogAndReturnRuntimeError(
        "Buffer size ({}) for message is too small given new bytesRead({}), {} is too large",
        buffer_.size(),
        bytesRead,
        pos
      );
    }

    buffer_.setWritePosition(pos);
    if (buffer_.availableToRead() == header_.size) {
      allDataRead_ = true;
    }

    return allDataRead_;
  }

  std::expected<bool, std::exception> NamedPipeMessage::onWrite(std::size_t bytesWritten) {
    buffer_.setReadPosition(buffer_.readPosition() + bytesWritten);
    if (buffer_.availableToRead() == 0) {
      allDataWritten_ = true;
    }

    return allDataWritten_;
  }

  std::expected<bool, std::exception> NamedPipeMessage::processHeader() {
    if (header_.size <= 0 || header_.id <= 0) {
      reset();
      return false;
    }

    headerProcessed_ = true;

    buffer_.reset();
    buffer_.resize(header_.size);

    return true;
  }

  NamedPipeMessageHeader* NamedPipeMessage::resetHeader() {
    header_.id = 0;
    header_.sourceId = 0;
    header_.size = 0;
    return &header_;
  }

  std::size_t NamedPipeMessage::packetSize() const {
    return packetSize_;
  }

  std::size_t NamedPipeMessage::size() {
    return header_.size;
  }

  std::optional<std::exception> NamedPipeMessage::error() const {
    return error_;
  }

  std::expected<bool, std::exception> NamedPipeMessage::setHeader(const NamedPipeMessageHeader& newHeader) {
    header_ = newHeader;
    return processHeader();
  }

  NamedPipeMessageHeader* NamedPipeMessage::header() {
    return &header_;
  }

  const NamedPipeMessageHeader* NamedPipeMessage::header() const {
    return &header_;
  }

  NamedPipeMessage* NamedPipeMessage::reset() {
    error_ = std::nullopt;
    resetHeader();
    headerProcessed_ = false;
    headerWritten_ = false;
    allDataRead_ = false;
    allDataWritten_ = false;
    buffer_.reset();
    return this;
  }

  MessageDataPacket NamedPipeMessage::getNextReadPacket() {
    return {buffer_.writeData(), buffer_.availableToWrite()};
  }

  MessageDataPacket NamedPipeMessage::getNextWritePacket() {
    return {buffer_.readData(), buffer_.availableToRead()};
  }

  DynamicByteBuffer::ValueType* NamedPipeMessage::data() {
    return buffer_.data();
  }

  const DynamicByteBuffer::ValueType* NamedPipeMessage::data() const {
    return buffer_.data();
  }

  std::expected<bool, std::exception> NamedPipeMessage::setData(
    const DynamicByteBuffer::ValueType* data,
    DynamicByteBuffer::SizeType length
  ) {
    buffer_.write(data, length);
    return true;
  }
}
