#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

#include <fmt/core.h>
#include <gtest/gtest.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Shared::FileSystem;
using namespace  std::chrono_literals;

namespace fs = std::filesystem;

namespace {

  class FileWatcherTests;

  log::logger L = GetCategoryWithType<FileWatcherTests>();

  class FileWatcherTests : public testing::Test {
  protected:
    FileWatcherTests() = default;

    virtual void TearDown() override {
      L.flush();
    }
  };
}// namespace

TEST_F(FileWatcherTests, watch) {
    auto tmpPath = GetTemporaryDirectory("filewatch-tests");
    spdlog::info("FileUtilTests using temp dir ({})", tmpPath.string());
    std::atomic_int changeCount = 0;
    FileWatcher watch(
        tmpPath,
        [&](auto& data, auto changeType) {
            spdlog::info("File ({}) changed ({})", fs::absolute(data.path).string(), magic_enum::enum_name(changeType));
            ++changeCount;
        }
    );

    watch.start();

    auto file1 = tmpPath / "test.dat";
    spdlog::info("FileUtilTests file1 ({})", file1.string());

    auto res = Utils::WriteTextFile(file1, "test123");
    EXPECT_TRUE(res.has_value()) << "Failed to write file1";

    std::this_thread::sleep_for(1s);
    EXPECT_EQ(changeCount, 2);

    watch.stop();

}