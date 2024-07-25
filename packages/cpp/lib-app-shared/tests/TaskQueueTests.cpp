#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/ServiceManager.h>


using namespace IRacingTools::Shared::Logging;
using namespace IRacingTools::Shared::Common;
using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;

using namespace IRacingTools::Shared::Services;

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
