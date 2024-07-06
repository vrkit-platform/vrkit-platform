#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <fmt/core.h>
#include <gtest/gtest.h>

using namespace IRacingTools::Shared;

namespace {
constexpr Geometry::Coordinate kCoordinate_NYC = {40.7468831, -73.994756};
constexpr Geometry::Coordinate kCoordinate_SFO = {37.6164442, -122.3886441};
} // namespace

TEST(GeoTests, float_conversion) {
    Geometry::CoordinateToPixelConverter pixelFConverter{};

    fmt::println(
        "Input\nNYC lat={},lon={} \t\tSFO lat={},lon={}",
        kCoordinate_NYC.latitude,
        kCoordinate_NYC.longitude,
        kCoordinate_SFO.latitude,
        kCoordinate_SFO.longitude
    );

    auto pixelNYC = pixelFConverter.coordinateToPixel(kCoordinate_NYC);
    auto pixelSFO = pixelFConverter.coordinateToPixel(kCoordinate_SFO);

    fmt::println("NYC x={},y={} \t\tSFO x={},y={}", pixelNYC.x, pixelNYC.y, pixelSFO.x, pixelSFO.y);

    auto coordNYC = pixelFConverter.pixelToCoordinate(pixelNYC);
    auto coordSFO = pixelFConverter.pixelToCoordinate(pixelSFO);

    fmt::println(
        "NYC lat={},lon={} \t\tSFO lat={},lon={}",
        coordNYC.latitude,
        coordNYC.longitude,
        coordSFO.latitude,
        coordSFO.longitude
    );

    EXPECT_LT(pixelSFO.x, pixelNYC.x) << "Longitude/X check";
    EXPECT_GT(pixelSFO.y, pixelNYC.y) << "Latitude/Y check";

    EXPECT_LT(std::abs(coordNYC.latitude - kCoordinate_NYC.latitude), 1.0f);
    EXPECT_LT(std::abs(coordNYC.longitude - kCoordinate_NYC.longitude), 1.0f);
    EXPECT_LT(std::abs(coordSFO.latitude - kCoordinate_SFO.latitude), 1.0f);
    EXPECT_LT(std::abs(coordSFO.longitude - kCoordinate_SFO.longitude), 1.0f);
}

TEST(GeoTests, calculate_distance) {
    constexpr auto distTestPairs = {std::make_tuple(Geometry::MetricUnit::Kilometer, 4023.0, 500.0),
                                    std::make_tuple(Geometry::MetricUnit::Meter, 4023000.0, 500000.0),};
    for (auto &[unit, match, errBias] : distTestPairs) {
        auto distance = Geometry::CalculateDistance(kCoordinate_NYC, kCoordinate_SFO, unit);

        fmt::println(
            "Distance from NYC(lat={},lon={}) to SFO(lat={},lon={}): {} {}",
            kCoordinate_NYC.latitude,
            kCoordinate_NYC.longitude,
            kCoordinate_SFO.latitude,
            kCoordinate_SFO.longitude,
            distance,
            magic_enum::enum_name(unit)
        );


        EXPECT_NEAR(distance, match, errBias);
    }
}
