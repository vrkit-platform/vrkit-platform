#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

#include <IRacingTools/Shared/Services/TelemetryDataService.h>
// #include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/ServiceManager.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
//
// using namespace IRacingTools::Shared::Services;
//
// namespace fs = std::filesystem;
//
// namespace {
//
//   class ServiceManagerTests;
//
//   auto L = GetCategoryWithType<ServiceManagerTests>();
//
//
//   class ServiceManagerTests : public testing::Test {
//   protected:
//     ServiceManagerTests() = default;
//
//     virtual void TearDown() override {
//       L->flush();
//     }
//   };
//
// }// namespace
//
// TEST_F(ServiceManagerTests, create_simple_container) {
//   using ServiceManagerType = ServiceManager<TelemetryDataService>;
//   auto manager = std::make_shared<ServiceManagerType>();
//
//   EXPECT_EQ(1, ServiceManagerType::ServiceCount);
// }
