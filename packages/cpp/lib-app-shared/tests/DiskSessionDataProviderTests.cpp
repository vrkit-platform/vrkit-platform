#include <chrono>
#include <gsl/util>
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <ranges>

#include <IRacingSDK/Utils/LUT.h>
#include <IRacingSDK/Utils/Singleton.h>
#include <IRacingSDK/Utils/Traits.h>

#include <VRKit/Shared/Logging/LoggingManager.h>


#include <IRacingSDK/ClientManager.h>
#include <IRacingSDK/DiskClient.h>
#include <IRacingSDK/DiskClientDataFrameProcessor.h>
#include <IRacingSDK/VarHolder.h>
#include <VRKit/Shared/DiskSessionDataProvider.h>


using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;
using namespace VRKit::Shared::Logging;

using namespace spdlog;
using namespace std::chrono_literals;

using namespace VRKit::Models::RPC::Events;

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

    std::shared_ptr<IRacingSDK::DiskClient> CreateDiskClient(const std::string& filename) {
        auto file = ToIBTTestFile(filename);
        auto client = std::make_shared<IRacingSDK::DiskClient>(file, file.string(),IRacingSDK::DiskClient::Extras{});
        return client;
    }

    std::shared_ptr<VRKit::Shared::DiskSessionDataProvider> CreateRaceRecordingDiskSessionDataProvider(const std::string& raceName) {
        auto file = ToRaceRecordingTestFile(raceName);
        return std::make_shared<VRKit::Shared::DiskSessionDataProvider>(file, file.string(),VRKit::Shared::DiskSessionDataProvider::Options{
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
    auto onEventHandler = [&subscriber, &sessionInfoChangeCount] (
        SessionEventType type,
        auto& sessionClientProvider,
        const std::shared_ptr<SessionDataProvider>& sessionDataProvider) {

        if (type != SessionEventType::SESSION_EVENT_TYPE_METADATA_CHANGED)
            return;

        std::shared_ptr<SessionEventData> data = sessionDataProvider->getSessionEventData(type);
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