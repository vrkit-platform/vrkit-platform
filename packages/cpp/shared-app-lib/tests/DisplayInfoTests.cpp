#include <IRacingTools/Shared/System/DisplayInfo.h>
#include <gtest/gtest.h>

using namespace IRacingTools::Shared::System;

class DisplayInfoTests : public testing::Test {
protected:
    DisplayInfoTests() = default;

    static void SetUpTestSuite() {
        ASSERT_TRUE(DisplayInfoSetup(true));
    }

    virtual void TearDown() override {
        spdlog::default_logger()->flush();
    }
};

TEST_F(DisplayInfoTests, GetAll) {
    auto res = GetAllDisplayInfo();
    ASSERT_TRUE(res.has_value());

    auto displays = res.value();
    ASSERT_GT(displays.size(),0);
}

TEST_F(DisplayInfoTests, GenerateScreenInfo) {
    auto res = DisplayScreenInfo::generate();
    ASSERT_TRUE(res.has_value());

    auto screenInfo = res.value();
    EXPECT_GT(screenInfo.displays.size(),0);
    EXPECT_LE(screenInfo.x,screenInfo.xOriginOffset);
    EXPECT_LE(screenInfo.y,screenInfo.xOriginOffset);

    spdlog::trace(screenInfo.toString());
}

TEST_F(DisplayInfoTests, ScreenInfo_equalTo) {
    auto res1 = DisplayScreenInfo::generate();
    ASSERT_TRUE(res1.has_value());
    auto& screenInfo1 = res1.value();

    auto res2 = DisplayScreenInfo::generate();
    ASSERT_TRUE(res2.has_value());
    auto& screenInfo2 = res2.value();

    EXPECT_TRUE(screenInfo1.equalTo(screenInfo2));
    EXPECT_TRUE(screenInfo2.equalTo(screenInfo1));

}

