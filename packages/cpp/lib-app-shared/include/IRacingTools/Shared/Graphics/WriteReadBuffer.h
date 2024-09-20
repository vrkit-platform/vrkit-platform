//
// Created by jglanz on 5/1/2024.
//

#pragma once


#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>


#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>

namespace IRacingTools::Shared::Graphics {

  /**
   * @brief Manages writing to and reading from a buffer
   */
  class WriteReadBuffer : public std::enable_shared_from_this<WriteReadBuffer> {
  public:

    static constexpr std::uint32_t BytesPerPixelRGBA = 4;
    static constexpr std::uint32_t BytesPerPixelRGB = 3;

    using Byte = std::uint8_t;
    using Buffer = std::vector<Byte>;


    /**
     * @brief Holds buffer configuration
     */
    struct Config {
      std::uint32_t width{0};
      std::uint32_t height{0};
      std::uint32_t bpp{BytesPerPixelRGBA};

      bool isValid() const {
        return width > 0 && height > 0 && bpp > 0;
      }

      std::uint32_t bufferSize() const {
        return width * height * bpp;
      }

      Config(const std::uint32_t& width, const std::uint32_t& height, const std::uint32_t& bpp);

      static Config Create(const std::uint32_t& width, const std::uint32_t& height, const std::uint32_t& bpp) {
        return {width,height, bpp};
      }
    };

    /**
     * @brief Read function shape
     */
    using ReadFn = std::function<bool(const Byte* buf, std::uint32_t size, const Config& config)>;

    explicit WriteReadBuffer(const std::optional<Config>& options = std::nullopt);
    WriteReadBuffer(WriteReadBuffer&&) = delete;
    WriteReadBuffer(const WriteReadBuffer&) = delete;

    ~WriteReadBuffer();

    void reconfigure(const Config& newConfig);


    std::uint32_t bufferSize();

    void lockRead();

    void lockWrite();

    bool lockReadTry();

    bool lockWriteTry();

    void unlockRead();

    void unlockWrite();

    bool isValid();

    bool onSwapRead(ReadFn fn);

    bool read(ReadFn fn);

    /**
     * @brief Direct pointer to current read buffer.
     *   If you use this method, the responsibility for
     *   locking & unlocking is on the caller
     *
     * @return pointer to memory for read
     */
    Byte* readBuffer();


    /**
     * @brief read buffer size (be sure to have the read lock)
     * @return read buffer size
     */
    std::uint32_t readBufferSize();

    std::recursive_mutex& readMutex();


    /**
     * @brief Direct pointer to current write buffer.
     *   If you use this method, the responsibility for
     *   locking & unlocking is on the caller
     *
     * @return pointer to memory for read
     */
    Byte* writeBuffer();

    std::uint32_t writeBufferSize();

    std::recursive_mutex& writeMutex();

    bool write(const Buffer& buf, std::uint32_t size, bool skipSwap = false);

    bool write(const Byte* buf, std::uint32_t size, bool skipSwap = false);

    void destroy();

  private:

    Config config_;
    Buffer readBuffer_{};
    Buffer writeBuffer_{};

    std::atomic_bool destroyed_{false};
    std::atomic_uint32_t swapCount_{0};
    std::condition_variable swapCondition_{};
    std::mutex swapMutex_{};
    std::recursive_mutex writeMutex_{};
    std::recursive_mutex readMutex_{};

    /**
     * @brief Resets the state of the object to its initial conditions.
     */
    void reset();
  };


} // namespace IRacingTools::Shared::Graphics
