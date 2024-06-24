#include <ranges>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/Traits.h>

#include <gtest/gtest.h>
#include <fmt/core.h>
#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/VarHolder.h>
#include <spdlog/spdlog.h>

using namespace IRacingTools::SDK;
using namespace IRacingTools::SDK::Utils;


using namespace spdlog;

namespace fs = std::filesystem;

namespace {

    constexpr auto IBTTestFile1 = "ibt-fixture-superformulalights324_montreal.ibt";

    // LMP3 @ motegi
    constexpr auto IBTTestFile2 = "ligierjsp320_twinring.ibt";

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

    // Setup the variable holders
    // "Lap", "LapCurrentLapTime", 'PlayerCarMyIncidentCount'
    VarHolder sessionTimeVar(IRacingTools::SDK::KnownVarName::SessionTime, provider.get());

    // Get start time value
    auto sessionStartTime = sessionTimeVar.getDouble();

    // Skip to the target index `total - 1`
    auto targetIndex = client->getSampleCount() - 1;
    ASSERT_TRUE(client->seek(targetIndex));

    // Get the end time
    auto sessionEndTime = sessionTimeVar.getDouble();
    EXPECT_NE(sessionStartTime,sessionEndTime);

    info("sessionStartTime={}, sessionEndTime={}",sessionStartTime,sessionEndTime);
    
    client->close();

    

}

TEST_F(DiskClientTests, aggregate_laps) {
 
    auto file = ToIBTTestFile(IBTTestFile2);

    DiskClientDataFrameProcessor<std::size_t> frameProc(file);
    auto client = frameProc.getClient();
    auto provider = client->getProvider();

    using LapDataFrame = std::tuple<double, int, double, int, double, double>;
    using LapDataWithPath = std::tuple<double, int, double, int, std::vector<std::pair<double, double>>>;
    VarHolder sessionTimeVar(IRacingTools::SDK::KnownVarName::SessionTime, provider.get());
    VarHolder lapVar(IRacingTools::SDK::KnownVarName::Lap, provider.get());
    VarHolder lapTimeCurrentVar(IRacingTools::SDK::KnownVarName::LapCurrentLapTime, provider.get());
    VarHolder incidentCountVar(IRacingTools::SDK::KnownVarName::PlayerCarMyIncidentCount, provider.get());
    VarHolder latVar(IRacingTools::SDK::KnownVarName::Lat, provider.get());
    VarHolder lonVar(IRacingTools::SDK::KnownVarName::Lon, provider.get());

    std::vector<LapDataFrame> frames{client->getSampleCount()};
    auto addCurrentFrameData = [&] (const DiskClientDataFrameProcessor<std::size_t>::Context& context) {
        // info("Adding frame ({} of {}), session time ({})", context.frameIndex, context.frameCount, context.sessionTimeSeconds);
        frames.emplace_back(sessionTimeVar.getDouble(), lapVar.getInt(), lapTimeCurrentVar.getDouble(), incidentCountVar.getInt(),
            latVar.getDouble(), lonVar.getDouble());
    };

    std::size_t lapCount = 0;
    auto res = frameProc.run([&] (const auto& context, auto& currentLap) {
        addCurrentFrameData(context);
        auto lap = lapVar.getInt();
        if (lap > currentLap) {
            currentLap += 1;
        }
        return true;
    }, lapCount);

    EXPECT_TRUE(res.has_value());

    EXPECT_GT(lapCount, 0);
    info("lapCount={},frameCount={}", lapCount, res.value_or(0));

    auto frameLapChunkFn = [](const LapDataFrame & o1, const LapDataFrame & o2) {
        return std::get<1>(o1) == std::get<1>(o2);
    };
    auto frameLapChunks = frames | std::views::chunk_by(frameLapChunkFn);
    int32_t totalIncidients = 0;
    std::vector<LapDataWithPath> laps{};
    for (auto const& chunk : frameLapChunks) {
        LapDataWithPath lap{};
        for (auto const& frame : chunk) {
            if (std::get<0>(frame) > std::get<0>(lap)) {
                std::get<0>(lap) = std::get<0>(frame);
                std::get<1>(lap) = std::get<1>(frame);
                std::get<2>(lap) = std::get<2>(frame);
                std::get<3>(lap) = std::get<3>(frame);
                auto lat = std::get<4>(frame);
                auto lon = std::get<5>(frame);
                if (lat != 0.0 && lon != 0.0) {
                    std::get<4>(lap).emplace_back(lat,std::get<5>(frame));
                }
            }
        }
        auto lapSessionTime = std::get<0>(lap);
        if (lapSessionTime && (laps.empty() || std::get<0>(laps.back()) < lapSessionTime)) {
            auto incidentCount = std::get<3>(lap);
            std::get<3>(lap) = incidentCount - totalIncidients;
            totalIncidients = incidentCount;

            laps.push_back(std::move(lap));
        }
    }

    for (auto& lap: laps) {
        auto&[sessionTime, lapNumber, lapTime, incidientCount, coordinates] = lap;
        info("sessionTime={},lap={},lapTimeSeconds={},incidentCount={},coordinateCount={}", sessionTime, lapNumber, lapTime, incidientCount, coordinates.size());
    }

    auto getLap = [] (const LapDataWithPath & it) { return std::get<1>(it);};
    auto getLapTime = [] (const LapDataWithPath & it) { return std::get<2>(it);};
    auto getIncidentCount = [] (const LapDataWithPath & it) { return std::get<3>(it);};
    auto isIncompleteLap = [&](const LapDataWithPath & it) { return getLap(it) == 0 || getLap(it) == (laps.size() - 1);};
    auto isBadLap = [&](const LapDataWithPath & it) { return getIncidentCount(it) > 0;};
    auto badLapCount = std::ranges::distance(std::ranges::filter_view(laps | std::views::filter(std::not_fn(isIncompleteLap)),isBadLap));

    info("Bad lap count == {}", badLapCount);
    EXPECT_GT(badLapCount, 0);

    LapDataWithPath emptyLap {0,0,0,0,{}};
    auto bestLap = std::ranges::fold_left(
        laps | std::views::filter(std::not_fn(isBadLap)), emptyLap , [&] (const LapDataWithPath& currentBest,const LapDataWithPath& it) {
            if (getLap(currentBest) == 0 || getLapTime(it) < getLapTime(currentBest))
                return it;
            return currentBest;
        });

    info("Best lap ({}), seconds: {}", getLap(bestLap), getLapTime(bestLap));


}