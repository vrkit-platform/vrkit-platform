#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
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
  
  fs::path GetIBTFixturePath() {
    return fs::current_path() / "data" / "ibt";
  }

  std::filesystem::path ToIBTTestFile(const std::string &filename) {
    return GetIBTFixturePath() / filename;
  }

  class TelemetryDataServiceTests;

  log::logger L = GetCategoryWithType<TelemetryDataServiceTests>();



  class TelemetryDataServiceTests : public testing::Test {
  protected:
    TelemetryDataServiceTests() = default;

    virtual void TearDown() override {
      L.flush();
    }
  };

}// namespace

TEST_F(TelemetryDataServiceTests, list_ibt_files) {
  auto pwd = fs::current_path();
  auto fixturePath = ToIBTTestFile(IBTTestFile1);
  {
    auto service = std::make_shared<TelemetryDataService>(TelemetryDataService::Options{
      .ibtPaths = {GetIBTFixturePath()}
    });

    auto ibtFiles = service->listAvailableIBTFiles();
    EXPECT_GT(ibtFiles.size(), 0);
  }
}

TEST_F(TelemetryDataServiceTests, service_setup_and_load) {
  auto tmpDir = GetTemporaryDirectory();
  auto trackDataFile = tmpDir / TrackDataPath; 
  
  {
    auto service = std::make_shared<TelemetryDataService>(TelemetryDataService::Options{
      .dataFile = trackDataFile
    });
    auto res = service->load();
    
    EXPECT_FALSE(res.has_value());
    EXPECT_EQ(res.error().code(),ErrorCode::NotFound);

    auto msg = std::make_shared<TelemetryDataFile>();
    msg->set_id("id-1");
    msg->set_alias("id-1-alias");
    msg->set_filename("test-file-1.ibt");
    EXPECT_TRUE(service->set(msg).has_value());

    EXPECT_TRUE(service->save().has_value());
  }

  {
    auto service = std::make_shared<TelemetryDataService>(TelemetryDataService::Options{
      .dataFile = trackDataFile
    });

    auto res = service->load();
    EXPECT_TRUE(res.has_value());
    EXPECT_EQ(service->size(), 1);

  }
  
}
