#include <IRacingTools/Shared/Graphics/WriteReadBuffer.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

namespace IRacingTools::Shared::Graphics {
  namespace {
    auto L = Logging::GetCategoryWithType<WriteReadBuffer>();
  }


  WriteReadBuffer::Config::Config(const std::uint32_t& width, const std::uint32_t& height, const std::uint32_t& bpp) : width(width), height(height), bpp(bpp) {
  }

  WriteReadBuffer::WriteReadBuffer(const std::optional<Config>& options) : config_(options.value_or(Config::Create(0, 0, BytesPerPixelRGBA))) {
    reset();
  }

  WriteReadBuffer::~WriteReadBuffer() {
    L->info("Destroy");
  }

  void WriteReadBuffer::reconfigure(const Config& newConfig) {
    std::scoped_lock lock(writeMutex_, readMutex_, swapMutex_);
    config_ = newConfig;
    reset();
  }

  std::uint32_t WriteReadBuffer::bufferSize() {
    return config_.bufferSize();
  }

  void WriteReadBuffer::lockRead() {
    readMutex_.lock();
  }

  void WriteReadBuffer::lockWrite() {
    writeMutex_.lock();
  }

  bool WriteReadBuffer::lockReadTry() {
    return readMutex_.try_lock();
  }

  bool WriteReadBuffer::lockWriteTry() {
    return writeMutex_.try_lock();
  }

  void WriteReadBuffer::unlockRead() {
    readMutex_.unlock();
  }

  void WriteReadBuffer::unlockWrite() {
    writeMutex_.unlock();
  }

  bool WriteReadBuffer::isValid() {
    return config_.isValid();
  }

  bool WriteReadBuffer::onSwapRead(ReadFn fn) {
    std::uint32_t swapCount = swapCount_;
    {
      std::unique_lock swapLock(swapMutex_);
      swapCondition_.wait(
        swapLock,
        [&] {
          return destroyed_ || swapCount != swapCount_;
        }
      );

      if (!destroyed_ && swapCount != swapCount_) {
        std::scoped_lock readLock(readMutex_);
        if (destroyed_) return false;

        return fn(readBuffer_.data(), readBuffer_.size(), config_);
      }
    }

    return false;
  }

  bool WriteReadBuffer::read(ReadFn fn) {
    std::scoped_lock locks(swapMutex_, readMutex_);
    if (!isValid()) {
      L->error("Cannot read buffer, it is not valid");
      return false;
    }

    return fn(readBuffer_.data(), readBuffer_.size(), config_);
  }

  bool WriteReadBuffer::write(const Buffer& buf, std::uint32_t size, bool skipSwap) {
    return write(buf.data(), size, skipSwap);
  }

  bool WriteReadBuffer::write(const Byte* buf, std::uint32_t size, bool skipSwap) {
    std::scoped_lock writeLock(writeMutex_);
    if (!isValid()) {
      L->error("Cannot write to buffer, it is not valid");
      return false;
    }

    if (size != bufferSize()) {
      L->error("Cannot write to buffer, size({}) of buf doesn't match bufferSize({})", size, bufferSize());
      return false;
    }

    memcpy(writeBuffer_.data(), buf, size);

    if (!destroyed_ && !skipSwap) {
      std::scoped_lock readLock(swapMutex_, readMutex_);
      if (destroyed_) return false;

      std::swap(writeBuffer_, readBuffer_);
      ++swapCount_;
      swapCondition_.notify_all();
    }

    return true;
  }

  WriteReadBuffer::Byte* WriteReadBuffer::readBuffer() {
    return readBuffer_.data();
  }

  std::uint32_t WriteReadBuffer::readBufferSize() {
    return readBuffer_.size();
  }

  std::recursive_mutex& WriteReadBuffer::readMutex() {
    return readMutex_;
  }

  WriteReadBuffer::Byte* WriteReadBuffer::writeBuffer() {
    return writeBuffer_.data();
  }

  std::uint32_t WriteReadBuffer::writeBufferSize() {
    return writeBuffer_.size();
  }

  std::recursive_mutex& WriteReadBuffer::writeMutex() {
    return writeMutex_;
  }

  void WriteReadBuffer::destroy() {
    destroyed_ = true;
    swapCondition_.notify_all();
  }

  void WriteReadBuffer::reset() {
    std::scoped_lock lock(writeMutex_, readMutex_, swapMutex_);
    if (!isValid()) {
      L->warn("Invalid config");
      return;
    }

    writeBuffer_.resize(config_.bufferSize());
    readBuffer_.resize(config_.bufferSize());
  }
} // namespace IRacingTools::Shared::Graphics
