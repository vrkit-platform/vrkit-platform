#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/ServiceManager.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;

using namespace IRacingTools::Shared::Services;

namespace fs = std::filesystem;

namespace {

  class BoostDITests;

  auto L = GetCategoryWithType<BoostDITests>();


  class BoostDITests : public testing::Test {
  protected:
    BoostDITests() = default;

    virtual void TearDown() override {
      L->flush();
    }
  };


  class ExampleDepService {
  public:
    std::string sayHello(const std::string &name);
  };

  class TrackService {
    std::shared_ptr<ExampleDepService> depService_;

  public:
    explicit TrackService(const std::shared_ptr<ExampleDepService> &depService);
    std::string sayHello(std::string name);
  };

  std::string ExampleDepService::sayHello(const std::string &name) {
    std::string greeting = "Hello " + name;

    return greeting;
  }

  TrackService::TrackService(
      const std::shared_ptr<ExampleDepService> &depService)
      : depService_(depService) {
  }

  std::string TrackService::sayHello(std::string name) {
    return depService_->sayHello(name);
  }

} // namespace

TEST_F(BoostDITests, create_simple_container) {
  namespace di = boost::di;
  auto injector = di::make_injector(
      di::bind<ExampleDepService>().to<ExampleDepService>().in(di::singleton),
      di::bind<TrackService>().to<TrackService>().in(di::singleton)

  );

  auto trackService = injector.create<std::shared_ptr<TrackService>>();


  EXPECT_EQ("Hello Jon123", trackService->sayHello("Jon123"));
}
