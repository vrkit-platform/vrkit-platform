#include <chrono>
#include <fmt/core.h>
#include <gsl/util>
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <ranges>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/Traits.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>


#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/VarHolder.h>
#include <IRacingTools/Shared/DiskSessionDataProvider.h>


using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::Shared;
using namespace IRacingTools::Shared::Logging;

using namespace spdlog;
using namespace std::chrono_literals;

using namespace IRacingTools::Models::RPC::Events;

namespace fs = std::filesystem;

namespace {

    class MockSubscriber {
    public:
        MOCK_METHOD(void, onEvent, (SessionEventType type, std::shared_ptr<SessionEventData> data), ());
    };

    class DiskSessionDataProviderTests;

    auto L = Logging::GetCategoryWithType<DiskSessionDataProviderTests>();

    class DiskSessionDataProviderTests : public testing::Test {
    protected:
        DiskSessionDataProviderTests() = default;

        virtual void SetUp() override {
            L->flush_on(Level::trace);
        }

        virtual void TearDown() override {
            L->flush();
        }
    };

    // Formula C Lights @ montreal
    constexpr auto IBTTestFile1 = "ibt-fixture-superformulalights324_montreal.ibt";

    // LMP3 @ motegi
    constexpr auto IBTTestFile2 = "ligierjsp320_twinring.ibt";

    constexpr auto IBTRaceRecordingTestFile1 = "f4-tsukubu";

    std::filesystem::path ToIBTTestFile(const std::string & filename) {
        return fs::current_path() / "data" / "ibt" / "telemetry" / filename;
    }



    std::filesystem::path ToRaceRecordingTestFile(const std::string & raceName) {
        return fs::current_path() / "data" / "ibt" / "race-recordings" / raceName;
    }

    std::shared_ptr<IRacingTools::SDK::DiskClient> CreateDiskClient(const std::string& filename) {
        auto file = ToIBTTestFile(filename);
        auto client = std::make_shared<IRacingTools::SDK::DiskClient>(file, file.string(),IRacingTools::SDK::DiskClient::Extras{});
        return client;
    }

    std::shared_ptr<IRacingTools::Shared::DiskSessionDataProvider> CreateRaceRecordingDiskSessionDataProvider(const std::string& raceName) {
        auto file = ToRaceRecordingTestFile(raceName);
        return std::make_shared<IRacingTools::Shared::DiskSessionDataProvider>(file, file.string(),IRacingTools::Shared::DiskSessionDataProvider::Options{
            .disableRealtimePlayback = true
        });
    }
}



TEST_F(DiskSessionDataProviderTests, session_info_updates) {
    MockSubscriber subscriber{};
    EXPECT_CALL(subscriber, onEvent)
        .Times(testing::AtLeast(5));

    auto provider = CreateRaceRecordingDiskSessionDataProvider(IBTRaceRecordingTestFile1);
    auto client = std::static_pointer_cast<DiskClient>(provider->clientProvider()->getClient());

    std::atomic_int32_t sessionInfoChangeCount = 0;
    auto onEventHandler = [&subscriber, &sessionInfoChangeCount] (SessionEventType type, std::shared_ptr<SessionEventData> data) {
        if (type != SessionEventType::SESSION_EVENT_TYPE_INFO_CHANGED)
            return;
        subscriber.onEvent(type, data);
        ++sessionInfoChangeCount;
    };

    provider->subscribe(onEventHandler);
    provider->start();
    while (provider->isRunning()) {
        std::this_thread::sleep_for(100ms);
        if (sessionInfoChangeCount > 5) {
            provider->stop();
            break;
        }
    }

    EXPECT_GT(sessionInfoChangeCount, 5);

}