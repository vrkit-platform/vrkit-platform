#include <ctime>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

#include <gtest/gtest.h>

using namespace IRacingTools::Shared::FileSystem;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;

using namespace  std::chrono_literals;

namespace {

  class FileUtilTests;

  auto L = Logging::GetCategoryWithType<FileUtilTests>();

  class FileUtilTests : public testing::Test {
  protected:
    FileUtilTests() = default;

    virtual void SetUp() override {
      L->flush_on(Level::trace);
    }

    virtual void TearDown() override {
      L->flush();
    }
  };
}
TEST_F(FileUtilTests, Files_GetIRacingDocumentPath) {
    auto irTelemPath = GetIRacingDocumentPath("telemetry");
    EXPECT_TRUE(irTelemPath.has_value());
}

TEST_F(FileUtilTests, GetFileTimestamps) {
  using Clock = std::chrono::system_clock;
  auto tmpPath = GetTemporaryDirectory("timestamps");
  auto file1 = tmpPath / "test-timestamps.file";
  if (fs::exists(file1))
    fs::remove(file1);

  std::string testContent ("timestamptest");
  auto res = WriteTextFile(file1, testContent);
  ASSERT_TRUE(res.has_value()) << std::format("Failed to write to file: {}", file1.string());

  auto wrote = res.value();
  auto wroteResultMsg = std::format("Wrote {} bytes of data, expected {} bytes  to file: {}", wrote, testContent.length(), file1.string());
  spdlog::info(wroteResultMsg);
  EXPECT_TRUE(wrote == testContent.length()) << wroteResultMsg;
  EXPECT_TRUE(fs::exists(file1));

  auto tsRes = GetFileTimestamps<Clock>(file1);
  EXPECT_TRUE(tsRes.has_value());
  auto& ts = tsRes.value();

  std::time_t time = Clock::to_time_t(ts.createdAt);
  char timeString[std::size("yyyy-mm-ddThh:mm:ssZ")];
  std::strftime(std::data(timeString), std::size(timeString),
                "%FT%TZ", std::localtime(&time));
  //createdAt={0:%F}T{0:%R%z},modifiedAt={0:%F}T{0:%R%z}
  spdlog::info("File ({}) time={}", file1.string(), timeString);

  auto createdAt = duration_cast<std::chrono::seconds>(ts.createdAt.time_since_epoch()).count();
  auto now = TimeEpoch<std::chrono::seconds,Clock>().count();

  auto diff = std::abs(now - createdAt);
  EXPECT_LT(diff, 5);



}




