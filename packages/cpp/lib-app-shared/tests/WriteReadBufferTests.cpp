#include <ctime>

#include <VRKit/Shared/FileSystemHelpers.h>
#include <VRKit/Shared/FileWatcher.h>
#include <VRKit/Shared/Logging/LoggingManager.h>

#include <gtest/gtest.h>
#include <VRKit/Shared/Graphics/ImageDataBuffer.h>
#include <VRKit/Shared/Graphics/WriteReadBuffer.h>

using namespace VRKit::Shared::FileSystem;
using namespace VRKit::Shared;
using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;

using namespace  std::chrono_literals;

namespace {

  class WriteReadBufferTests;

  auto L = Logging::GetCategoryWithType<WriteReadBufferTests>();

  class WriteReadBufferTests : public testing::Test {
  protected:
    WriteReadBufferTests() = default;

    virtual void SetUp() override {
      L->flush_on(Level::trace);
    }

    virtual void TearDown() override {
      L->flush();
    }
  };
}

TEST_F(WriteReadBufferTests, ReadWaitForWrite) {
  Graphics::WriteReadBuffer::Config wrbufConfig(400,400,4);
  auto wrbuf = std::make_shared<Graphics::WriteReadBuffer>(wrbufConfig);
  std::atomic_size_t readCount = 0;
  auto readFn = [&] (const Graphics::WriteReadBuffer::Byte* buf, std::uint32_t size, const Graphics::WriteReadBuffer::Config& config) -> bool {
    EXPECT_EQ(wrbufConfig.bufferSize(), size);
    EXPECT_EQ(config.bufferSize(), size);
    ++readCount;

    L->info("Read buffer received with {} bytes", size);
    return true;
  };
  std::thread readThread([&] {
    wrbuf->onSwapRead(readFn);
  });

  std::this_thread::sleep_for(100ms);
  Graphics::WriteReadBuffer::Buffer buf{};
  buf.resize(wrbufConfig.bufferSize(), '0');
  wrbuf->write(buf, wrbufConfig.bufferSize());

  readThread.join();
  EXPECT_EQ(readCount, 1);
}

TEST_F(WriteReadBufferTests, ImageDataBuffer_single) {

  auto imageDataBuf = std::make_shared<Graphics::BGRAImageDataBuffer>(400,400);
  std::atomic_size_t readCount = 0;
  auto consumeFn = [&] (const Graphics::BGRAImageDataBuffer::Byte* buf, std::uint32_t size, Graphics::BGRAImageDataBuffer* aImageDataBuf) -> std::uint32_t {
    EXPECT_EQ(imageDataBuf->size(), size);
    EXPECT_EQ(aImageDataBuf->size(), size);
    ++readCount;

    L->info("Read buffer received with {} bytes", size);
    return true;
  };
  Graphics::BGRAImageDataBuffer::Buffer buf{};
  buf.resize(imageDataBuf->size(), '0');
  imageDataBuf->produce(buf.data(), imageDataBuf->size());

  std::thread readThread([&] {
    imageDataBuf->consume(consumeFn);
  });

  std::this_thread::sleep_for(100ms);

  readThread.join();
  EXPECT_EQ(readCount, 1);
}


// TODO: This test is NOT currently testing `swap`
TEST_F(WriteReadBufferTests, ImageDataBuffer_swap) {

  auto imageDataBuf1 = std::make_shared<Graphics::BGRAImageDataBuffer>(400,400);
  auto imageDataBuf2 = std::make_shared<Graphics::BGRAImageDataBuffer>(400,400);


  std::atomic_size_t readCount = 0;
  auto consumeFn = [&] (const Graphics::BGRAImageDataBuffer::Byte* buf, std::uint32_t size, Graphics::BGRAImageDataBuffer* aImageDataBuf) -> std::uint32_t {
    EXPECT_EQ(imageDataBuf1->size(), size);
    EXPECT_EQ(aImageDataBuf->size(), size);
    ++readCount;

    L->info("Read buffer received with {} bytes", size);
    return true;
  };

  Graphics::BGRAImageDataBuffer::Buffer buf{};
  buf.resize(imageDataBuf1->size(), '0');
  imageDataBuf1->produce(buf.data(), imageDataBuf1->size());

  std::thread readThread([&] {
    imageDataBuf1->consume(consumeFn);
  });

  std::this_thread::sleep_for(100ms);
  readThread.join();
  EXPECT_EQ(readCount, 1);
}






