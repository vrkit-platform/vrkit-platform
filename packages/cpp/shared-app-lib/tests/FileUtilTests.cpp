#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/FileWatcher.h>

#include <gtest/gtest.h>

using namespace IRacingTools::Shared::FileSystem;
using namespace IRacingTools::Shared;
using namespace IRacingTools::SDK;

using namespace  std::chrono_literals;

class FileUtilTests : public testing::Test {
    protected:
        FileUtilTests() = default;

        virtual void TearDown() override {
            spdlog::default_logger()->flush();
        }
};

TEST_F(FileUtilTests, Files_GetIRacingDocumentPath) {
    auto irTelemPath = GetIRacingDocumentPath("telemetry");
    EXPECT_TRUE(irTelemPath.has_value());
}

TEST_F(FileUtilTests, FileWatcher_watch) {
    auto tmpPath = GetTemporaryDirectory("filewatch-tests");
    spdlog::info("FileUtilTests using temp dir ({})", tmpPath.string());
    std::atomic_int changeCount = 0;
    FileWatcher watch(
        tmpPath,
        [&](auto& data, auto changeType) {
            spdlog::info("File ({}) changed ({})", fs::absolute(data.path).string(), magic_enum::enum_name(changeType));
            ++changeCount;
        }
    );

    auto file1 = tmpPath / "test.dat";
    spdlog::info("FileUtilTests file1 ({})", file1.string());

    auto res = Utils::WriteTextFile(file1, "test123");
    EXPECT_TRUE(res.has_value()) << "Failed to write file1";

    std::this_thread::sleep_for(1s);
    EXPECT_EQ(changeCount, 2);

    watch.destroy();

    //
    // spdlog::trace(
    //     "NYC lat={},lon={} \t\tSFO lat={},lon={}",
    //     coordNYC.latitude,
    //     coordNYC.longitude,
    //     coordSFO.latitude,
    //     coordSFO.longitude
    // );
    //
    // EXPECT_LT(pixelSFO.x, pixelNYC.x) << "Longitude/X check";
    // EXPECT_GT(pixelSFO.y, pixelNYC.y) << "Latitude/Y check";
    //
    // EXPECT_LT(std::abs(coordNYC.latitude - kCoordinate_NYC.latitude), 1.0f);
    // EXPECT_LT(std::abs(coordNYC.longitude - kCoordinate_NYC.longitude), 1.0f);
    // EXPECT_LT(std::abs(coordSFO.latitude - kCoordinate_SFO.latitude), 1.0f);
    // EXPECT_LT(std::abs(coordSFO.longitude - kCoordinate_SFO.longitude), 1.0f);
}
