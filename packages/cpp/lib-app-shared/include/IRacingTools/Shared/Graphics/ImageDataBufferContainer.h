//
// Created by jglanz on 5/1/2024.
//

#pragma once


#include <magic_enum.hpp>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/ImageDataBuffer.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Utils/RingQueue.h>

namespace IRacingTools::Shared::Graphics {

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
    using BufferPtr = std::shared_ptr<Buffer>;
    using ConsumeFn = typename Buffer::ConsumeFn;

  private:

    Utils::RingQueue<BufferPtr, 3> availableBuffers_{};
    BufferPtr readyBuffer_{nullptr};
    std::mutex queueMutex_{};
    std::atomic_uint32_t frameCounter_{0};

    std::uint32_t width_;
    std::uint32_t height_;

  public:

    using Byte = typename ImageDataBuffer<FormatChannels>::Byte;

    const std::uint32_t bpp = ToBPP(FormatChannels);

    ImageDataBufferContainer(const std::uint32_t& width, const std::uint32_t& height) : width_(width), height_(height) {
      resize(width, height, true);
    }

    ImageDataBufferContainer() = delete;

    std::uint32_t width() {
      return width_;
    }

    std::uint32_t height() {
      return height_;
    }

    BufferPtr newBuffer() {
      return std::make_shared<Buffer>(width(), height());
    }

    bool resize(const std::uint32_t& width, const std::uint32_t& height, bool force = false) {
      std::scoped_lock lock(queueMutex_);
      if (!force && width == width_ && height == height_) {
        return true;
      }

      if (!IsNonZeroSize<uint32_t>({width, height})) return false;

      availableBuffers_.clear(BufferPtr{nullptr});
      width_ = width;
      height_ = height;
      for (int i = 0; i < availableBuffers_.capacity(); i++) {
        if (availableBuffers_.full()) break;

        availableBuffers_.push(newBuffer());
      }

      return true;
    }

    std::expected<std::uint32_t, SDK::GeneralError> produce(const Byte* data, std::uint32_t len) {
      static auto L = Logging::GetCategoryWithName("ImageDataBufferContainer");
      BufferPtr writeBuffer;
      {
        std::scoped_lock lock(queueMutex_);
        auto writeBufferOpt = availableBuffers_.pop();
        if (!writeBufferOpt) return createImageDataBufferError("availableBuffers returned no buffer");

        writeBuffer = writeBufferOpt.value();
      }

      VRK_LOG_AND_FATAL_IF(len != writeBuffer->size(), "Data len does == buffer len")
      std::unique_lock writeLock(*writeBuffer);
      auto res = writeBuffer->produce(data, len);

      std::scoped_lock lock(queueMutex_);
      if (!res || !res.value()) {
        availableBuffers_.push(writeBuffer);

        if (!res) return std::unexpected(res.error());
        if (!res.value()) return createImageDataBufferError("0 returned from frame producer");
      }

      writeBuffer.swap(readyBuffer_);

      // IF THE READY BUFFER IS VALID, THEN PUSH IT TO THE
      // BACK OF THE AVAILABLE QUEUE
      if (writeBuffer && !availableBuffers_.full()) {
        availableBuffers_.push(writeBuffer);
      }

      return res.value();
    }

    /**
     * @brief Swap buffer with readyBuffer_ if valid
     *
     * @param targetBuffer buffer that should have its raw ptr swapped
     * @return true if swapped
     */
    bool consume(BufferPtr& targetBuffer) {
      std::scoped_lock lock(queueMutex_);

      if (!targetBuffer || !readyBuffer_ || targetBuffer->bpp != readyBuffer_->bpp || targetBuffer->isDestroyed() || readyBuffer_->isDestroyed())
        return false;

      if (targetBuffer->size() != readyBuffer_->size()) {
        targetBuffer->resize(readyBuffer_->width(), readyBuffer_->height());
      }
      readyBuffer_.swap(targetBuffer);
      return true;
    }

    void destroy() {
      std::scoped_lock lock(queueMutex_);
      availableBuffers_.destroy();

      for (auto& b : availableBuffers_) {
        b.destroy();
      }

      if (readyBuffer_) readyBuffer_->destroy();
    }

    PixelSize getImageSize() const {
      return {width_, height_};
    }

    std::uint32_t getImageDataSize() const {
      return width_ * height_ * bpp;
    }

    std::uint32_t getImageDataStride() const {
      return width_ * bpp;
    }
  };

  using BGRAImageDataBufferContainer = ImageDataBufferContainer<ImageFormatChannels::RGBA>;
} // namespace IRacingTools::Shared::Graphics
