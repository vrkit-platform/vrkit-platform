#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <VRKit/Shared/FileSystemHelpers.h>

#include <VRKit/Shared/Common/TaskQueue.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Services/ServiceManager.h>


using namespace VRKit::Shared::Logging;
using namespace VRKit::Shared::Common;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;

using namespace VRKit::Shared::Services;

namespace fs = std::filesystem;

namespace {

  class TaskQueueTests;

  auto L = GetCategoryWithType<TaskQueueTests>();


  class TaskQueueTests : public testing::Test {
  protected:
    TaskQueueTests() = default;

    virtual void TearDown() override {
      L->flush();
    }
  };




} // namespace

TEST_F(TaskQueueTests, queue1) {
  TaskQueue<std::string, std::string, int> greetWithAgeQueue([] (std::string name, int age) -> std::string {
    return std::format("Hello {}, you are {} years old", name, age);
  });

  auto future = greetWithAgeQueue.enqueue("Jon", 43);

  ASSERT_TRUE(future.valid()) << "No future returned";
  auto greeting = future.get();

  EXPECT_EQ("Hello Jon, you are 43 years old", greeting);
}
