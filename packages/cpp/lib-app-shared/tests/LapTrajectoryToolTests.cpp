#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Shared::Services;

namespace fs = std::filesystem;

namespace {

  // Formula C Lights @ montreal
  constexpr auto IBTTestFile1 = "ibt-fixture-superformulalights324_montreal.ibt";

  // LMP3 @ motegi
  constexpr auto IBTTestFile2 = "ligierjsp320_twinring.ibt";

  // Radical SR10 @ Austria/Spielberg
  constexpr auto IBTTestFile3 = "radicalsr10_spielberg gp 2024-06-28 21-13-04.ibt";
  
  std::filesystem::path ToIBTTestFile(const std::string &filename) {
    return fs::current_path() / "data" / "ibt" / filename;
  }


  class LapTrajectoryToolTests;

  log::logger L = GetCategoryWithType<LapTrajectoryToolTests>();

  class LapTrajectoryToolTests : public testing::Test {
  protected:
    LapTrajectoryToolTests() = default;

    virtual void TearDown() override {
      L.flush();
    }
  };

}// namespace


TEST_F(LapTrajectoryToolTests, createLapTrajectory) {
  auto file = ToIBTTestFile(IBTTestFile2);
  auto tmpDir = GetTemporaryDirectory();
  LapTrajectoryTool tool;
  EXPECT_TRUE(tool.createLapTrajectory(file, LapTrajectoryTool::CreateOptions{.outputDir = tmpDir}).has_value());
}
