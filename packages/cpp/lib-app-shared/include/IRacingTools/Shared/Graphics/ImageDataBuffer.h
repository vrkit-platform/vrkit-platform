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

  /**
   * @brief Manages writing to and reading from a buffer
   */
  template <std::uint32_t BPP>
  class ImageDataBuffer : public std::enable_shared_from_this<ImageDataBuffer<BPP>>, public SDK::Utils::Lockable {
  public:

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
      return width > 0 && height > 0 && bpp > 0;
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
      return produce([&] (Byte* dst, std::uint32_t dstSize, ImageDataBuffer* _imageDataBuffer) -> std::uint32_t {
        return (memcpy(dst, src, size)) ? size : 0;
      });
    }

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Buffer& buf) {
      return produce(buf.data(), buf.size());
    }

    void destroy() {
      setStatus(Status::Destroyed);
    }

    std::expected<bool, SDK::GeneralError> swap(ImageDataBuffer& other, bool skipWaitIfUnavailable = false) {
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

    std::expected<bool, SDK::GeneralError> swap(const std::shared_ptr<ImageDataBuffer> & other, bool skipWaitIfUnavailable = false) {
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
    };

  private:

    std::recursive_mutex mutex_{};
    Buffer buffer_{};
    std::atomic<Status> status_{Status::Empty};


    std::atomic_bool destroyed_{false};
    // std::mutex statusMutex_{};
    std::condition_variable_any statusCondition_{};

  };


  using RGBAImageDataBuffer = ImageDataBuffer<magic_enum::enum_underlying(ImageFormatChannels::RGBA)>;


} // namespace IRacingTools::Shared::Graphics
