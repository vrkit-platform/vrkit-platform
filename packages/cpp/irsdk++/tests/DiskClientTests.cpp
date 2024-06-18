#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/Traits.h>
#include <gtest/gtest.h>
#include <fmt/core.h>
#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/VarHolder.h>
#include <spdlog/spdlog.h>

using namespace IRacingTools::SDK::Utils;


using namespace spdlog;

namespace fs = std::filesystem;

namespace {

    constexpr auto IBTTestFile1 = "ibt-fixture-superformulalights324_montreal.ibt";

    std::filesystem::path ToIBTTestFile(const std::string & filename) {
        return fs::current_path() / "data" / "ibt" / filename;
    }

    std::shared_ptr<IRacingTools::SDK::DiskClient> CreateDiskClient(const std::string& filename) {
        auto file = ToIBTTestFile(filename);
        auto client = std::make_shared<IRacingTools::SDK::DiskClient>(file, file.string());

        //IRacingTools::SDK::ClientManager::Get().add(file.string(), client);

        return client;
    }
}



class DiskClientTests : public testing::Test {
    protected:
    DiskClientTests() = default;

    virtual void TearDown() override {
        default_logger()->flush();
    }

};


TEST_F(DiskClientTests, can_open) {

    auto client = CreateDiskClient(IBTTestFile1);
    EXPECT_TRUE(client->isAvailable());
    EXPECT_TRUE(client->isFileOpen());

    auto provider = client->getProvider();

    EXPECT_GT(client->getSampleCount(), 0);
    EXPECT_EQ(client->getSampleIndex(), 0);

    info("SampleCount({})", client->getSampleCount());

    // Setup the time holder
    IRacingTools::SDK::VarHolder VarSessionTime(IRacingTools::SDK::KnownVarName::SessionTime, provider.get());

    // Get start time value
    auto sessionStartTime = VarSessionTime.getDouble();

    // Skip to the target index `total - 1`
    auto targetIndex = client->getSampleCount() - 1;
    ASSERT_TRUE(client->seek(targetIndex));

    // Get the end time
    auto sessionEndTime = VarSessionTime.getDouble();
    EXPECT_NE(sessionStartTime,sessionEndTime);

    info("sessionStartTime={}, sessionEndTime={}",sessionStartTime,sessionEndTime);
    // IRacingTools::SDK::DiskClient client()
    // EXPECT_EQ(testMap.lookup("t1"), 0);
    // EXPECT_EQ(testMap["t1"], 0);
    // EXPECT_EQ(testMap["t2"], 1);
    //
    // auto values = testMap.values();
    // EXPECT_EQ(values[1], 1);
}

// TEST_F(DiskClientTests, is_container) {
//     // std::vector<int> vints = {0,123};
//
//     EXPECT_EQ(is_container<std::vector<int>>, true);
//     EXPECT_EQ(is_container<int>, false);
// }