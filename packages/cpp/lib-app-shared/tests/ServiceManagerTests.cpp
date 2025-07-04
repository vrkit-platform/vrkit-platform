#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <VRKit/Shared/FileSystemHelpers.h>

#include <VRKit/Shared/Services/TelemetryDataService.h>
// #include <VRKit/Shared/TrackMapGeometry.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Services/ServiceManager.h>

using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;
//
// using namespace VRKit::Shared::Services;
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
