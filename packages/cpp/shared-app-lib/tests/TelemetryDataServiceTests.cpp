#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <fmt/core.h>
#include <gtest/gtest.h>

using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Shared::Services;

namespace fs = std::filesystem;

namespace {

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
  auto tmpDir = GetTemporaryDirectory();
  auto trackDataFile = tmpDir / TrackDataPath; 
  
  {
    auto service = std::make_shared<TelemetryDataService>(TelemetryDataService::Options{
      .dataFile = trackDataFile
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
