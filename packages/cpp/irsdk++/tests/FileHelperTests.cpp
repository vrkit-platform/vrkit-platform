#include <gtest/gtest.h>
#include <IRacingTools/SDK/Utils/FileHelpers.h>

using namespace IRacingTools::SDK::Utils;

namespace fs = std::filesystem;

// namespace {
// constexpr Geometry::Coordinate kCoordinate_NYC = {40.7468831, -73.994756};
// constexpr Geometry::Coordinate kCoordinate_SFO = {37.6164442, -122.3886441};
// } // namespace

TEST(FileHelperTests, FileHasExtension) {
    std::vector<fs::path> goods = {"file.Json", ".Json", ".JSON","test.dashboard.irt.json"};
    for (auto& good : goods ) {
        EXPECT_TRUE(HasFileExtension(good, ".json"));
    }
    std::vector<fs::path> bads = {"file.txt", "file.Json5", ".irtJSON"};

    for (auto& bad : bads ) {
        EXPECT_FALSE(HasFileExtension(bad, ".json"));
    }
}

