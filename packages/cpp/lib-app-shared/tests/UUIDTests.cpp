#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>

using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;


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
