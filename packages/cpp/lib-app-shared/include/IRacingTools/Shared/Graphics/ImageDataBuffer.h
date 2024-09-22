//
// Created by jglanz on 5/1/2024.
//

#pragma once


#include <magic_enum.hpp>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

namespace IRacingTools::Shared::Graphics {

  template <typename... Args>
  std::unexpected<SDK::GeneralError> createImageDataBufferError(fmt::format_string<Args...> fmt, Args&&... args) {
    static auto L = Logging::GetCategoryWithName("ImageDataBuffer");
    auto msg = fmt::format(fmt, std::forward<Args>(args)...);
    L->error(msg);
    return std::unexpected(SDK::GeneralError{msg});
  }


  enum class ImageFormatChannels : std::uint32_t {
    RGB = 3, RGBA = 4
  };


  constexpr std::uint32_t ToBPP(ImageFormatChannels format) {
    return magic_enum::enum_underlying(format);
  }

  /**
   * @brief Manages writing to and reading from a buffer
   */
  template <ImageFormatChannels FormatChannels>
  class ImageDataBuffer : public std::enable_shared_from_this<ImageDataBuffer<FormatChannels>>, public SDK::Utils::Lockable {
  public:

    static constexpr auto BPP = magic_enum::enum_underlying(FormatChannels);

    enum class Status {
      Empty, Filled, Destroyed
    };

    using Byte = std::uint8_t;
    using Buffer = std::vector<Byte>;
    using ConsumeFn = std::function<std::uint32_t(const Byte* data, std::uint32_t size, ImageDataBuffer* imageDataBuffer)>;
    using ProduceFn = std::function<std::uint32_t(Byte* data, std::uint32_t size, ImageDataBuffer* imageDataBuffer)>;

    const std::uint32_t width;
    const std::uint32_t height;
    const std::uint32_t bpp = BPP;

    bool isValid() const {
      return width > 0 && height > 0 && bpp > 0 && !isDestroyed();
    }

    /**
     * @brief read buffer size (be sure to have the read lock)
     * @return read buffer size
     */
    std::uint32_t size() const {
      return width * height * bpp;
    }

    /**
     * @brief read buffer size (be sure to have the read lock)
     * @return read buffer size
     */
    std::uint32_t stride() const {
      return width * bpp;
    }

    /**
     * @brief
     * @param width Width of the image data this will hold in pixels, NOT the stride
     * @param height Height in pixels of the image data
     */
    ImageDataBuffer(const std::uint32_t& width, const std::uint32_t& height) : width(width), height(height), buffer_(width * height * BPP) {

    }

    ImageDataBuffer() = delete;

    ImageDataBuffer(ImageDataBuffer&&) = delete;

    ImageDataBuffer(const ImageDataBuffer&) = delete;

    virtual ~ImageDataBuffer() {
      destroy();
    }

    virtual void lock() override {
      mutex_.lock();
    }

    virtual bool try_lock() override {
      return mutex_.try_lock();
    }

    bool tryLock() {
      return try_lock();
    }

    virtual void unlock() override {
      mutex_.unlock();
    }

    /**
     * @brief Change the status & notify waiting
     *   parties.
     *
     * @param newStatus the new status
     * @return the status that was stored in `status_`
     */
    Status setStatus(Status newStatus) {
      // std::scoped_lock lock(*this, statusMutex_);
      std::scoped_lock lock(*this);
      auto oldStatus = status_.exchange(newStatus);
      statusCondition_.notify_all();
      return oldStatus;
    }

    Status status() const {
      return status_;
    }

    void setEmpty() {
      setStatus(Status::Empty);
    }

    bool isEmpty() const {
      return status() == Status::Empty;
    };


    bool isFilled() const {
      return status() == Status::Filled;
    };

    bool isDestroyed() const {
      return status() == Status::Destroyed;
    };


    /**
     * @brief Direct pointer to buffer.
     *   If you use this method, the responsibility for
     *   locking & unlocking is on the caller
     *
     * @return pointer to buffer memory
     */
    Byte* data() {
      return buffer_.data();
    }


    std::expected<std::uint32_t, SDK::GeneralError> produce(ProduceFn fn) {
      std::scoped_lock lock(*this);
      if (!isValid()) {
        return createImageDataBufferError("Cannot write to buffer, it is not valid");
      }

      // if (size != this->size()) {
      //   return createImageDataBufferError("Cannot write to buffer, size({}) of buf doesn't match bufferSize({})", size, this->size());
      // }

      std::uint32_t result;
      if (waitFor(
        Status::Empty,
        [&] {
          result = fn(buffer_.data(), buffer_.size(), this);
          setStatus(Status::Filled);
        }
      )) {
        return result;
      }

      return createImageDataBufferError("Status never reached Empty (status={})", std::string{magic_enum::enum_name<Status>(status())});;
    }

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Byte* src, std::uint32_t size) {
      return produce(
        [&](Byte* dst, std::uint32_t dstSize, ImageDataBuffer* _imageDataBuffer) -> std::uint32_t {
          if (dstSize != size) {
            return 0;
          }
          return std::memcpy(dst, src, dstSize) ? dstSize : 0;
        }
      );
    }

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Buffer& buf) {
      return produce(buf.data(), buf.size());
    }

    void destroy() {
      setStatus(Status::Destroyed);
    }

    std::expected<bool, SDK::GeneralError> swap(ImageDataBuffer& other, bool skipWaitIfUnavailable = false) {
      if (!isValid()) {
        return createImageDataBufferError("Cannot swap to buffer, it is not valid");
      }

      if (skipWaitIfUnavailable) {
        if (std::try_lock(*this, other) > -1) {
          return false;
        }
      } else {
        std::lock(*this, other);
      }

      gsl::finally(
        [&] {
          unlock();
          other.unlock();
        }
      );

      if (isDestroyed() || other.isDestroyed() || other.width != width || other.height != height || other.bpp != bpp || !isValid() || !other.isValid()) {
        return createImageDataBufferError("Cannot swap buffers, sizes don't match or buffers are not valid");
      }

      std::swap(buffer_, other.buffer_);

      auto otherStatus = other.status();
      other.setStatus(status());
      setStatus(otherStatus);

      return true;
    }

    std::expected<bool, SDK::GeneralError> swap(const std::shared_ptr<ImageDataBuffer>& other, bool skipWaitIfUnavailable = false) {
      return swap(*other, skipWaitIfUnavailable);
    }

    bool waitFor(Status targetStatus, std::function<void()> fn) {
      // std::unique_lock lock(statusMutex_);
      std::unique_lock lock(*this);
      auto testFn = [this, targetStatus]() {
        return status_ == targetStatus || status_ == Status::Destroyed;
      };
      if (!testFn()) {
        statusCondition_.wait(lock, testFn);
      }

      if (status_ == targetStatus) {
        fn();
        return true;
      }
      return false;
    };

    std::expected<std::uint32_t, SDK::GeneralError> consume(Byte* dst, std::uint32_t size) {
      return consume(
        [&](const Byte* src, std::uint32_t srcSize, ImageDataBuffer* _imageDataBuffer) -> std::uint32_t {
          if (srcSize != size) {
            return 0;
          }
          return std::memcpy(dst, src, srcSize) ? srcSize : 0;
        }
      );
    };

    std::expected<std::uint32_t, SDK::GeneralError> consume(ConsumeFn fn) {


      std::uint32_t res;
      if (waitFor(
        Status::Filled,
        [&] {
          std::scoped_lock lock(*this);
          res = fn(buffer_.data(), size(), this);
          setStatus(Status::Empty);
        }
      )) {
        return res;
      }

      return createImageDataBufferError("Status never reached Filled (status={})", std::string{magic_enum::enum_name<Status>(status())});
    }

  private:

    std::recursive_mutex mutex_{};
    Buffer buffer_{};
    std::atomic<Status> status_{Status::Empty};


    std::atomic_bool destroyed_{false};
    // std::mutex statusMutex_{};
    std::condition_variable_any statusCondition_{};

  };


  using RGBAImageDataBuffer = ImageDataBuffer<ImageFormatChannels::RGBA>;

  /**
   * @brief contains both a read & write buffer, that are auto-swapped on fill
   *
   * @tparam FormatChannels # of channels in the image buffer that will be produced/consumed
   */
  template <ImageFormatChannels FormatChannels>
  class ImageDataBufferContainer {
  public:

    static constexpr auto BPP = magic_enum::enum_underlying(FormatChannels);
    using Buffer = ImageDataBuffer<FormatChannels>;
    using ConsumeFn = typename Buffer::ConsumeFn;

  private:

    Buffer writeBuffer_;
    Buffer readBuffer_;

  public:

    using Byte = typename ImageDataBuffer<FormatChannels>::Byte;

    const std::uint32_t width;
    const std::uint32_t height;
    const std::uint32_t bpp = ToBPP(FormatChannels);

    ImageDataBufferContainer(const std::uint32_t& width, const std::uint32_t& height) : writeBuffer_(width, height), readBuffer_(width, height), width(width), height(height) {

    }

    ImageDataBufferContainer() = delete;

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Byte* data, std::uint32_t len) {
      static auto L = Logging::GetCategoryWithName("ImageDataBufferContainer");

      VRK_LOG_AND_FATAL_IF(len != writeBuffer_.size(), "Data len does == buffer len")
      std::unique_lock writeLock(writeBuffer_);
      auto res = writeBuffer_.produce(data, len);
      if (!res) {
        return std::unexpected(res.error());
      }

      if (readBuffer_.swap(writeBuffer_)) {
        return createImageDataBufferError("Unable to swap read/write buffers");
      }

      return res.value();
    }

    std::expected<std::uint32_t, SDK::GeneralError> consume(ConsumeFn fn) {
      return readBuffer_.consume(fn);
    }

    std::expected<std::uint32_t, SDK::GeneralError> consume(Byte* data, std::uint32_t len) {
      return readBuffer_.consume(data, len);
    }

    void destroy() {
      for (auto& b : {writeBuffer_, readBuffer_}) {
        b.destroy();
      }
    }

    PixelSize getImageSize() const {
      return {width, height};
    }

    std::uint32_t getImageDataSize() const {
      return width * height * bpp;
    }

    std::uint32_t getImageDataStride() const {
      return width * bpp;
    }
  };

  using RGBAImageDataBufferContainer = ImageDataBufferContainer<ImageFormatChannels::RGBA>;
} // namespace IRacingTools::Shared::Graphics
