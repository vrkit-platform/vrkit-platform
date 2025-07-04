#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <VRKit/Shared/Common/UUIDHelpers.h>

#include <VRKit/Shared/Logging/LoggingManager.h>

using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;

/*
namespace {

  class UUIDTests;

  auto L = GetCategoryWithType<UUIDTests>();


  class UUIDTests : public testing::Test {
  protected:
    UUIDTests() = default;

    virtual void TearDown() override {
      L->flush();
    }
  };
} // namespace

TEST_F(UUIDTests, new_uuid) {
  auto uuid1 = Common::NewUUID();
  L->info("UUID1 >> {}", uuid1);
  EXPECT_GE(uuid1.length(),32);
}
*/