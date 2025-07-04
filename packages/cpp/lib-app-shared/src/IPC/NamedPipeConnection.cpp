#include <VRKit/Shared/IPC/NamedPipeHelpers.h>
#include <VRKit/Shared/IPC/NamedPipeMessage.h>
#include <VRKit/Shared/IPC/NamedPipeServer.h>
#include <VRKit/Shared/Utils/Win32Helpers.h>

#include <algorithm>
#include <format>
#include <ranges>

namespace VRKit::Shared::IPC {
  NamedPipeIO::NamedPipeIO(std::uint32_t connectionId, Role role): id(connectionId),
                                                                   role(role) {
    std::memset(&overlapped, 0, sizeof(OVERLAPPED));
    overlapped.hEvent = CreateManualResetEvent();
  }

  std::string NamedPipeIO::toString() {
    return std::format("NamedPipeIO(connectionId={},role={})", id, std::string{magic_enum::enum_name(role)});
  }

  std::expected<bool, std::exception> NamedPipeConnection::connect() {
    connectIO_.hasPendingIO = false;
    connected_ = false;

    // Start an overlapped connection for this pipe instance.
    BOOL connected = ConnectNamedPipe(pipeHandle_, &connectIO_.overlapped);

    // Overlapped ConnectNamedPipe should return zero.
    if (connected) {
      spdlog::error("ConnectNamedPipe already connected: {}", GetLastErrorAsString());
      connected_ = true;
      return true;
    }

    auto res = GetLastError();
    auto resName = GetLastErrorAsString();
    spdlog::info("CONNECT ({})", resName);
    switch (res) {
      // The overlapped connection in progress.
    case ERROR_IO_PENDING:
      connectIO_.hasPendingIO = true;
      break;

      // Client is already connected, so signal an event.

    case ERROR_PIPE_CONNECTED: {
      connected_ = true;
      if (!SetEvent(connectIO_.overlapped.hEvent)) {
        spdlog::warn("CONNECT: Unable to set event");
      }
      break;
    }
      // If an error occurs during the connect operation...
    default: {
      auto msg = std::format("ConnectNamedPipe failed with {}", resName);
      spdlog::error(msg);
      return std::unexpected<std::runtime_error>(msg);
    }
    }

    return !connectIO_.hasPendingIO;
  }

  MessageFactory::MessageFactory(NamedPipeServer* server, std::uint32_t connectionId) : server(server),
    connectionId(connectionId) {

  }

  NamedPipeMessage* MessageFactory::operator()() {
    return new NamedPipeMessage(connectionId, server->packetSize());
  }

  NamedPipeConnection::NamedPipeConnection(Private, NamedPipeServer* server, HANDLE pipeHandle, std::size_t packetSize):
    server_(server),
    packetSize_(packetSize),
    pipeHandle_(pipeHandle),
    messageFactory_(server, id_),
    messagePool_(messageFactory_) {


  }

  std::shared_ptr<NamedPipeConnection> NamedPipeConnection::Create(
    NamedPipeServer* server,
    HANDLE pipeHandle,
    std::size_t packetSize
  ) {
    return std::make_shared<NamedPipeConnection>(NamedPipeConnection::Private{}, server, pipeHandle, packetSize);
  }

  void NamedPipeConnection::destroy() {
    if (pipeHandle_ != INVALID_HANDLE_VALUE) {
      DisconnectNamedPipe(pipeHandle_);
      pipeHandle_ = nullptr;
    }
  }

  std::size_t NamedPipeConnection::packetSize() const {
    return packetSize_;
  }

  NamedPipeConnection::~NamedPipeConnection() {
    static std::mutex destructMutex_{};

    destroy();
    {
      std::lock_guard lock(destructMutex_);
      if (writeMessageQueuedEvent_) {
        CloseHandle(writeMessageQueuedEvent_);
        writeMessageQueuedEvent_ = nullptr;
      }
    }
  }

  std::vector<NamedPipePendingEvent> NamedPipeConnection::pendingEvents() {
    std::vector<NamedPipePendingEvent> events;
    for (auto io : allIO()) {
      if (io->hasPendingIO) {
        events.emplace_back(shared_from_this(), io);
      }
    }

    return events;
  }

  std::vector<NamedPipeIO*> NamedPipeConnection::allIO() {
    return {&connectIO_, &readIO_, &writeIO_};
  }

  std::uint32_t NamedPipeConnection::id() const {
    return id_;
  }

  HANDLE NamedPipeConnection::pipeHandle() {
    return pipeHandle_;
  }

  NamedPipeIO& NamedPipeConnection::readIO() {
    return readIO_;
  }

  NamedPipeIO& NamedPipeConnection::writeIO() {
    return writeIO_;
  }

  NamedPipeIO& NamedPipeConnection::connectIO() {
    return connectIO_;
  }

  bool NamedPipeConnection::isConnected() {
    if (connected_) {
      // assert(!connectIO_.hasPendingIO && "connectIO_.hasPendingIO is true?");
      return true;
    }

    return false;
  }

  bool NamedPipeConnection::isReadPending() {
    return readIO_.hasPendingIO;
  }

  std::expected<bool, std::exception> NamedPipeConnection::writeMessage(
    std::uint32_t id,
    std::uint32_t sourceId,
    const DynamicByteBuffer::ValueType* data,
    std::uint32_t size
  ) {
    if (!data || !size) {
      return LogAndReturnRuntimeError(
        "Invalid data={},size{}, can not write message",
        reinterpret_cast<const void*>(data),
        size
      );
    }

    // The ObjectPool implementation is thread-safe, so while copying/filling the message,
    // there is no need for an additional lock
    auto msg = messagePool_.acquire();
    msg->reset();
    auto headerRes = msg->setHeader({.id = id, .sourceId = sourceId, .clientId = 0, .size = size});

    if (!headerRes.has_value() || !headerRes.value()) {
      // The message acquired from the pool, will be automatically return
      // on destruct/delete.  No action required
      msg->reset();
      return std::unexpected(headerRes.error());
    }


    auto dataRes = msg->setData(data, size);
    if (!dataRes) {
      msg->reset();
      return std::unexpected(dataRes.error());
    }
    bool setWriteMessageEvent = true;
    {
      std::lock_guard lock(writeMessageQueueMutex_);
      // setWriteMessageEvent = writeMessageQueue_.empty();
      writeMessageQueue_.push_back(msg);
    }

    if (setWriteMessageEvent) {
      spdlog::debug("SetEvent(writeMessageQueuedEvent_)");
      server_->ioThreadNotify();
    }

    return true;


  }

  /**
   * Start a read operation
   *
   * @return if an error occurs, `std::unexpected<std::exception>`, otherwise `true` if a new read was queued or `false` if not connected or if a pending read was already scheduled
   */
  std::expected<bool, std::exception> NamedPipeConnection::startRead() {
    if (!isConnected()) {
      return false;
    }

    auto& io = readIO_;

    // If already pending, return
    if (io.hasPendingIO) {
      return false;
    }

    // Acquire message from pool here
    if (!readMessage_) {
      readMessage_ = messagePool_.acquire();
      readMessage_->reset();
    }

    DWORD bytesReadCount{0};
    bool success;
    if (readMessage_->isHeaderProcessed()) {
      auto [readData, readDataSize] = readMessage_->getNextReadPacket();
      success = ::ReadFile(
        pipeHandle_,
        readData,
        std::min<std::size_t>(readDataSize, packetSize()),
        &bytesReadCount,
        &io.overlapped
      );
    } else {
      success = ::ReadFile(pipeHandle_, readMessage_->header(), MessageHeaderSize, &bytesReadCount, &io.overlapped);
    }

    auto readRes = GetLastError();
    auto readResName = GetLastErrorAsString(readRes);
    if (success) {
      io.hasPendingIO = false;
      if (bytesReadCount > 0) {
        spdlog::info("Read complete message (bytesReadCount={})", bytesReadCount);
        auto onReadRes = onRead(bytesReadCount);
        if (!onReadRes.has_value()) {
          spdlog::error("startRead immediate data, res has error");
          return std::unexpected(onReadRes.error());
        }

        return startRead();
      }

      auto msg = std::format("No bytes read, but success == true, should disconnect ({}):{}", readRes, readResName);
      spdlog::warn(msg);
      return std::unexpected<std::runtime_error>(msg);
    }

    if (readRes == ERROR_MORE_DATA) {
      io.hasPendingIO = false;
      return startRead();
    }

    if (readRes == ERROR_IO_PENDING) {
      io.hasPendingIO = true;
      return true;
    }

    auto msg = std::format("Read failed, should disconnect ({}):{}", readRes, readResName);
    spdlog::error(msg);
    return std::unexpected<std::runtime_error>(msg);
  }

  std::expected<bool, std::exception> NamedPipeConnection::startWrite() {
    if (!isConnected()) {
      return false;
    }

    auto& io = writeIO_;

    // If already pending, return
    if (io.hasPendingIO) {
      return false;
    }

    // Acquire message from pool here
    if (!writeMessage_) {
      {
        std::lock_guard lock(writeMessageQueueMutex_);
        if (writeMessageQueue_.empty()) {
          return false;
        }

        writeMessage_ = writeMessageQueue_.front();
        writeMessageQueue_.pop_front();
      }

    }

    DWORD byteWriteCount{0};
    bool success;
    if (writeMessage_->isHeaderWritten()) {
      auto [writeData, writeDataSize] = writeMessage_->getNextWritePacket();
      success = ::WriteFile(
        pipeHandle_,
        writeData,
        std::min<std::size_t>(writeDataSize, packetSize()),
        &byteWriteCount,
        &io.overlapped
      );
    } else {
      success = ::WriteFile(pipeHandle_, writeMessage_->header(), MessageHeaderSize, &byteWriteCount, &io.overlapped);
      // writeMessage_->setHeaderWritten();
    }

    auto writeRes = GetLastError();
    auto writeResName = GetLastErrorAsString(writeRes);
    if (success) {
      io.hasPendingIO = false;
      if (byteWriteCount > 0) {
        spdlog::debug("Write complete message (byteWriteCount={})", byteWriteCount);
        auto onWriteRes = onWrite(byteWriteCount);
        if (!onWriteRes.has_value()) {
          spdlog::error("startWrite immediate data, res has error");
          return std::unexpected(onWriteRes.error());
        }

        return startWrite();
      }

      if (writeRes != ERROR_MORE_DATA && writeRes != ERROR_IO_PENDING)
        return LogAndReturnRuntimeError(
          "No bytes written, but success == true, should disconnect ({}):{}",
          writeRes,
          writeResName
        );

      return false;
    }

    if (writeRes == ERROR_IO_PENDING || writeRes == ERROR_MORE_DATA) {
      io.hasPendingIO = true;
      return true;
    }

    return LogAndReturnRuntimeError("Write failed, should disconnect ({}):{}", writeRes, writeResName);
  }

  bool NamedPipeConnection::setConnected(bool connected) {
    auto wasConnected = connected_.exchange(connected);
    connectIO_.hasPendingIO = false;
    return wasConnected;
  }

  LPOVERLAPPED NamedPipeConnection::readOverlapped() {
    return &readIO_.overlapped;
  }

  LPOVERLAPPED NamedPipeConnection::writeOverlapped() {
    return &writeIO_.overlapped;
  }


  std::expected<bool, std::exception> NamedPipeConnection::onRead(std::size_t bytesRead) {
    if (!readMessage_) {
      return std::unexpected<std::runtime_error>("readMessage is a nullptr");
    }

    readIO_.hasPendingIO = false;
    auto msg = readMessage_;

    if (!msg->isHeaderProcessed()) {
      if (MessageHeaderSize != bytesRead)
        return LogAndReturnRuntimeError(
          "bytes read for header should always be {} bytes, but {} bytes read",
          MessageHeaderSize,
          bytesRead
        );

      auto processedRes = msg->processHeader();
      if (!processedRes) {
        return std::unexpected(processedRes.error());
      }

      auto processed = processedRes.value();
      if (!processed) {
        return LogAndReturnRuntimeError("Invalid header read from {} bytes", bytesRead);
      }

      return false;
    }

    auto readCompletedRes = msg->onRead(bytesRead);
    if (!readCompletedRes) {
      return std::unexpected(readCompletedRes.error());
    }

    auto readCompleted = readCompletedRes.value();
    if (readCompleted) {
      spdlog::debug("NamedPipeMessage ({}) is fully read and can now be distributed", msg->id());
      server_->emitMessage(msg);
      readMessage_ = messagePool_.acquire();
      readMessage_->reset();
      return true;
    }

    return false;
  }

  std::expected<bool, std::exception> NamedPipeConnection::onWrite(std::size_t bytesWritten) {
    if (!writeMessage_) {
      return std::unexpected<std::runtime_error>("writeMessage is a nullptr");
    }

    writeIO_.hasPendingIO = false;
    auto msg = writeMessage_;

    if (!msg->isHeaderWritten()) {
      if (MessageHeaderSize != bytesWritten)
        return LogAndReturnRuntimeError(
          "bytes written for header should always be {} bytes, but {} bytes write",
          MessageHeaderSize,
          bytesWritten
        );

      msg->setHeaderWritten();

      return false;
    }

    auto writeCompletedRes = msg->onWrite(bytesWritten);
    if (!writeCompletedRes) {
      return std::unexpected(writeCompletedRes.error());
    }

    auto writeCompleted = writeCompletedRes.value();
    if (writeCompleted) {
      spdlog::debug("NamedPipeMessage ({}) is fully written to the connection pipe", msg->id());
      writeMessage_ = nullptr;
      return true;
    }

    return false;
  }
}
