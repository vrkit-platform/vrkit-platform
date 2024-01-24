#include <IRacingTools/SDK/LUT.h>
#include <fmt/core.h>
#include <gtest/gtest.h>

using namespace IRacingTools::SDK::Utils;

constexpr LUT<std::string_view, int, 2> testMap = {{"t1", 0},{"t2", 1}};

TEST(LUTTests, map_test) {
    EXPECT_EQ(testMap.lookup("t1"), 0);
    EXPECT_EQ(testMap["t1"], 0);
    EXPECT_EQ(testMap["t2"], 1);

    auto values = testMap.values();
    EXPECT_EQ(values[1], 1);
}
