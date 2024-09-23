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
