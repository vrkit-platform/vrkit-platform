#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

#include <IRacingTools/Shared/TrackMapGeometry.h>


using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;

using namespace IRacingTools::Shared::Services;
using namespace IRacingTools::Shared::Services::Pipelines;

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

  auto L = GetCategoryWithType<TelemetryDataServiceTests>();

  class TelemetryDataServiceTests : public testing::Test {
  protected:
    TelemetryDataServiceTests() = default;

    virtual void SetUp() override {
      L->flush_on(Level::trace);
    }

    virtual void TearDown() override {
      L->flush();
    }
  };

}// namespace

TEST_F(TelemetryDataServiceTests, get_track_map_pipeline_executor) {
  PipelineExecutorRegistrySetup();
  
  auto& reg = PipelineExecutorRegistry<PipelineType::PIPELINE_TYPE_TRACK_MAP,std::shared_ptr<TelemetryDataFile>>::Get();
  auto executor = reg.build();
  EXPECT_TRUE(!!executor) << "Executor factory was not registered";
}

TEST_F(TelemetryDataServiceTests, list_ibt_files) {
  auto pwd = fs::current_path();
  auto fixturePath = ToIBTTestFile(IBTTestFile1);
  auto serviceContainer = std::make_shared<ServiceContainer>();
  {
    auto service = std::make_shared<TelemetryDataService>(serviceContainer, TelemetryDataService::Options{
      .ibtPaths = {GetIBTFixturePath()}
    });

    auto ibtFiles = service->listTelemetryFiles();
    EXPECT_GT(ibtFiles.size(), 0);
  }
}

TEST_F(TelemetryDataServiceTests, service_setup_and_load) {
  auto tmpDir = GetTemporaryDirectory();
  auto trackDataFile = tmpDir / TelemetryDataFileJSONLFilename; 
  auto serviceContainer = std::make_shared<ServiceContainer>();
  {
    auto service = std::make_shared<TelemetryDataService>(serviceContainer, TelemetryDataService::Options{
      .jsonlFile = trackDataFile
    });
    auto res = service->load(true);
    
    EXPECT_TRUE(res.has_value());
    EXPECT_EQ(res.value().code(),ErrorCode::NotFound);

    auto msg = std::make_shared<TelemetryDataFile>();
    msg->set_id("id-1");
    msg->set_alias("id-1-alias");
    msg->mutable_file_info()->set_filename("test-file-1.ibt");
    EXPECT_TRUE(service->set(msg).has_value());

    EXPECT_TRUE(service->save().has_value());
  }

  {
    auto service = std::make_shared<TelemetryDataService>(serviceContainer, TelemetryDataService::Options{
      .jsonlFile = trackDataFile
    });

    auto res = service->load();
    EXPECT_TRUE(!res.has_value());
    EXPECT_EQ(service->size(), 1);

  }
  
}
