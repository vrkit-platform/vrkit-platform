#include <IRacingTools/Shared/UI/DashboardManager.h>
#include <gtest/gtest.h>

using namespace IRacingTools::Shared;

class DashboardManagerTests : public testing::Test {
    protected:
    DashboardManagerTests() = default;

    virtual void TearDown() override {
        spdlog::default_logger()->flush();
    }
};


TEST_F(DashboardManagerTests, DashboardStorage_defaultManager) {
    auto& storage = UI::DashboardStorage::Get();
    auto manager = storage.defaultManager();
    EXPECT_EQ(manager->path().string(), UI::DashboardStorage::GetDashboardsPath().string());
}

TEST_F(DashboardManagerTests, DashboardManager_listFiles) {
    // auto& storage = UI::DashboardStorage::Get();
    // auto manager = storage.defaultManager();
    // EXPECT_EQ(manager->path().string(), UI::DashboardStorage::GetDashboardsPath().string());
}

TEST_F(DashboardManagerTests, DashboardManager_list) {
    auto& storage = UI::DashboardStorage::Get();
    auto tmpDir = GetTemporaryDirectory();
    auto manager = storage.managerForPath(tmpDir);
    // EXPECT_EQ(manager->path().string(), UI::DashboardStorage::GetDashboardsPath().string());

    auto res = manager->generate("tmp-dash-config1");
    ASSERT_TRUE(res.has_value());

    auto [id1, file1, config1] = res.value();
    spdlog::info("Created dashboard config ({})", file1.string());
    EXPECT_TRUE(fs::exists(file1));
}

