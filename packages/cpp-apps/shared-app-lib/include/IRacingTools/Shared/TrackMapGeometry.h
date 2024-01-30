#pragma once

#include <algorithm>
#include <filesystem>
#include <numbers>
#include <numeric>
#include <type_traits>

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Models/TrackMapData.pb.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

#include "CoordinateToPixelConverter.h"

namespace IRacingTools::Shared::Geometry {
template<typename PixelType = float>
class LapTracjectoryConverter {
public:
    using Pixel = PixelBase<PixelType>;

    struct PixelCoordinateStep {
        Pixel pixel;
        double meters;
    };

    struct PixelCoordinateData {
        std::vector<PixelCoordinateStep> steps;
        Pixel max;
    };

    static constexpr bool kConvertToInteger = isPixelTypeInteger<PixelType>();

    explicit LapTracjectoryConverter(ZoomLevel zoomLevel = kZoomLevelDefault) :
        pixelConverter_(zoomLevel) {}

    PixelCoordinateData toPixels(const LapTrajectory &trajectory) {
        auto &path = trajectory.path();
        std::optional<Coordinate<double>> previousCoord{std::nullopt};
        auto geoPixels = std::accumulate(
            path.begin(),
            path.end(),
            std::vector<PixelCoordinateStep>{},
            [&](auto steps, auto &point) {
                Coordinate<double> coord{point.latitude(), point.longitude()};

                auto pixel = pixelConverter_.coordinateToPixel(coord);
                steps.push_back(
                    {.pixel = pixel, .meters = previousCoord ? CalculateDistance(previousCoord.value(), coord) : 0.0}
                );
                previousCoord = coord;
                // pixels.push_back(pixel);
                return steps;
            }
        );
        PixelType minX, maxX, minY, maxY;
        bool first = true;
        for (auto &step : geoPixels) {
            auto& [x,y] = step.pixel;
            if (first) {
                minX = maxX = x;
                minY = maxY = y;
                first = false;
            } else {
                if (x < minX) {
                    minX = x;
                }

                if (y < minY) {
                    minY = y;
                }

                if (x > maxX) {
                    maxX = x;
                }

                if (y > maxY) {
                    maxY = y;
                }
            }
        }

        PixelCoordinateData pixelData{.steps = {}, .max = {maxX - minX, maxY - minY}};
        std::for_each(
            geoPixels.begin(),
            geoPixels.end(),
            [&](auto &geoPixel) {
                auto [x,y] = geoPixel.pixel;

                pixelData.steps.push_back(
                    PixelCoordinateStep{.pixel = {x - minX, y - minY}, .meters = geoPixel.meters}
                );
            }
        );

        return pixelData;
    };

    TrackMap toTrackMap(const LapTrajectory &trajectory) {
        auto pixelData = toPixels(trajectory);

        TrackMap tm;
        std::for_each(
            pixelData.steps.begin(),
            pixelData.steps.end(),
            [&](auto &step) {
                auto& pixel = step.pixel;
                auto point = tm.add_points();
                point->set_x(pixel.x);
                point->set_y(pixel.y);
                point->set_distance(step.meters);
            }
        );
        auto size = tm.mutable_size();
        size->set_width(pixelData.max.x);
        size->set_height(pixelData.max.y);

        return tm;
    }

private:
    CoordinateToPixelConverter<PixelType> pixelConverter_;
};

/**
 * \brief Convert trajectory to track map
 *
 *
 * \param lapTrajectory datasource
 * \param zoomLevel scale to use, default is 18
 * \return
 */

TrackMap ToTrackMap(const LapTrajectory &lapTrajectory, ZoomLevel zoomLevel = kZoomLevelDefault);

TrackMap ScaleTrackMapToFit(const TrackMap &trackMap, const Graphics::Size &size);
} // namespace IRacingTools::Shared::Geo
