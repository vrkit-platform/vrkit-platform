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
    RGB = 3,
    RGBA = 4,
    BGRA = 4
  };


  constexpr std::uint32_t ToBPP(ImageFormatChannels format) {
    return magic_enum::enum_underlying(format);
  }

  /**
   * @brief Manages writing to and reading from a buffer
   */
  template <ImageFormatChannels FormatChannels>
  class ImageDataBuffer : public std::enable_shared_from_this<ImageDataBuffer<FormatChannels>>,
                          public SDK::Utils::Lockable {




  public:
    static constexpr auto BPP = magic_enum::enum_underlying(FormatChannels);

    enum class Status {
      Empty,
      NewData,
      OldData,
      Destroyed
    };

    using Byte = std::uint8_t;
    using Buffer = std::vector<Byte>;
    using ConsumeFn = std::function<std::uint32_t(
      const Byte* data,
      std::uint32_t size,
      ImageDataBuffer* imageDataBuffer
    )>;
    using ProduceFn = std::function<std::uint32_t(Byte* data, std::uint32_t size, ImageDataBuffer* imageDataBuffer)>;

    const std::uint32_t bpp = BPP;

    uint32_t frameIndex() {
      return frameIndex_;
    }

    uint32_t setFrameIndex(std::uint32_t newFrameIndex) {
      return frameIndex_.exchange(newFrameIndex);
    }

    bool isValid() {
      return width_ > 0 && height_ > 0 && bpp > 0 && !isDestroyed();
    }

    std::uint32_t width()  {
      return width_;
    }

    std::uint32_t height()  {
      return height_;
    }

    /**
     * @brief read buffer size (be sure to have the read lock)
     * @return read buffer size
     */
    std::uint32_t size() const {
      return width_ * height_ * bpp;
    }

    /**
     * @brief read buffer size (be sure to have the read lock)
     * @return read buffer size
     */
    std::uint32_t stride() const {
      return width_ * bpp;
    }

    /**
     * @brief
     * @param width Width of the image data this will hold in pixels, NOT the stride
     * @param height Height in pixels of the image data
     */
    ImageDataBuffer(const std::uint32_t& width, const std::uint32_t& height) : width_(width),
                                                                               height_(height) {
      resize(width_, height_);
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
      std::scoped_lock lock(*this);
      if (isDestroyed()) return Status::Destroyed;

      auto oldStatus = status_.exchange(newStatus);
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


    bool hasNewData() const {
      return status() == Status::NewData;
    };

    bool hasOldData() const {
      return status() == Status::OldData;
    };

    bool hasData() const {
      return !isDestroyed() &&  (hasNewData() || hasOldData());
    }

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

      setStatus(Status::Empty);
      auto res = fn(buffer_.data(), buffer_.size(), this);
      if (res > 0) setStatus(Status::NewData);

      return res;
    }

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Byte* src, std::uint32_t size) {
      return produce(
        [&](Byte* dst, std::uint32_t dstSize, ImageDataBuffer*) -> std::uint32_t {
          if (dstSize < size) {
            return 0;
          }

          if (std::memcpy(dst, src, size))
            return size;
          return 0;
        }
      );
    }

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Buffer& buf) {
      return produce(buf.data(), buf.size());
    }

    void destroy() {
      setStatus(Status::Destroyed);
    }

    std::expected<std::uint32_t, SDK::GeneralError> consume(ConsumeFn fn) {
      std::scoped_lock lock(*this);

      if (!hasData()) {
        return createImageDataBufferError(
          "Status is not Filled (status={})",
          std::string{magic_enum::enum_name<Status>(status())}
        );
      }

      auto res = fn(buffer_.data(), size(), this);
      setStatus(Status::OldData);

      return res;
    }

    void reset() {
      std::scoped_lock lock(*this);
      setStatus(Status::Empty);
      frameIndex_= 0;
    }

    bool resize(const std::uint32_t& width,const std::uint32_t& height) {
      std::scoped_lock lock(*this);

      if (destroyed_ || setStatus(Status::Empty) == Status::Destroyed) return false;
      width_ = width;
      height_ = height;

      buffer_.resize(width * height * BPP);

      frameIndex_= 0;
      return true;
    }

  private:

    std::recursive_mutex mutex_{};
    Buffer buffer_{};
    std::atomic<Status> status_{Status::Empty};
    std::atomic_bool destroyed_{false};
    std::atomic_uint32_t frameIndex_{0};

    std::atomic_uint32_t width_;
    std::atomic_uint32_t height_;

  };


  using BGRAImageDataBuffer = ImageDataBuffer<ImageFormatChannels::RGBA>;

} // namespace IRacingTools::Shared::Graphics
