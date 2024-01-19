#pragma once


#include <algorithm>
#include <filesystem>
#include <numbers>
#include <numeric>
#include <type_traits>

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Models/TrackMapData.pb.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

/*
Based on https://stackoverflow.com/questions/2651099/convert-long-lat-to-pixel-x-y-on-a-given-picture
public class GoogleMapsAPIProjection
{
private readonly double PixelTileSize = 256d;
private readonly double DegreesToRadiansRatio = 180d / Math.PI;
private readonly double RadiansToDegreesRatio = Math.PI / 180d;
private readonly PointF PixelGlobeCenter;
private readonly double XPixelsToDegreesRatio;
private readonly double YPixelsToRadiansRatio;

public GoogleMapsAPIProjection(double zoomLevel)
{
var pixelGlobeSize = this.PixelTileSize * Math.Pow(2d, zoomLevel);
this.XPixelsToDegreesRatio = pixelGlobeSize / 360d;
this.YPixelsToRadiansRatio = pixelGlobeSize / (2d * Math.PI);
var halfPixelGlobeSize = Convert.ToSingle(pixelGlobeSize / 2d);
this.PixelGlobeCenter = new PointF(
halfPixelGlobeSize, halfPixelGlobeSize);
}

public PointF FromCoordinatesToPixel(PointF coordinates)
{
var x = Math.Round(this.PixelGlobeCenter.X
+ (coordinates.X * this.XPixelsToDegreesRatio));
var f = Math.Min(
Math.Max(
Math.Sin(coordinates.Y * RadiansToDegreesRatio),
-0.9999d),
0.9999d);
var y = Math.Round(this.PixelGlobeCenter.Y + .5d *
Math.Log((1d + f) / (1d - f)) * -this.YPixelsToRadiansRatio);
return new PointF(Convert.ToSingle(x), Convert.ToSingle(y));
}

public PointF FromPixelToCoordinates(PointF pixel)
{
var longitude = (pixel.X - this.PixelGlobeCenter.X) /
this.XPixelsToDegreesRatio;
var latitude = (2 * Math.Atan(Math.Exp(
(pixel.Y - this.PixelGlobeCenter.Y) / -this.YPixelsToRadiansRatio))
- Math.PI / 2) * DegreesToRadiansRatio;
return new PointF(
Convert.ToSingle(latitude),
Convert.ToSingle(longitude));
}
}
*/
namespace IRacingTools::Shared::Geometry {
using ZoomLevel = size_t;
constexpr ZoomLevel kZoomLevelDefault = 20;

constexpr double kPixelTileSize = 256.0;
constexpr double kDegreesToRadiansRatio = 180.0 / std::numbers::pi;
constexpr double kRadiansToDegreesRatio = std::numbers::pi / 180.0;

struct Coordinate {
    double latitude;
    double longitude;
};

template<typename T>
struct PixelBase {
    T x;
    T y;
};

template<typename T>
struct PixelData {
    using Pixel = PixelBase<T>;
    std::vector<Pixel> pixels;

    Pixel max;
};

using PixelF = PixelBase<float>;
using PixelD = PixelBase<double>;
using PixelI = PixelBase<int>;

template<typename T>
constexpr bool isPixelTypeInteger() {
    if constexpr (std::is_same_v<T, float> || std::is_same_v<T, double>) {
        return true;
    }

    return false;
}

template<typename PixelType = float>
class PixelConverter {
public:
    using Pixel = PixelBase<PixelType>;
    static constexpr bool kConvertToInteger = isPixelTypeInteger<PixelType>();

    PixelType clampPixelValue(double value) {
        PixelType outValue;
        if (kConvertToInteger) {
            outValue = static_cast<PixelType>(value * 6.0);
        } else {
            outValue = static_cast<PixelType>(value);
        }
        return outValue;
    }

    explicit PixelConverter(ZoomLevel zoomLevel = kZoomLevelDefault) :
        zoomLevel_(zoomLevel) {
        pixelZoomWidth_ = kPixelTileSize * pow(2.0, static_cast<double>(zoomLevel));

        xPixelToDegreesRatio_ = pixelZoomWidth_ / 360.0;
        yPixelToRadiansRatio_ = pixelZoomWidth_ / (2.0 * std::numbers::pi);

        PixelType pixelZoomWidthHalf = pixelZoomWidth_ / static_cast<PixelType>(2.0);
        pixelCenter_ = {pixelZoomWidthHalf, pixelZoomWidthHalf};
    };

    Pixel coordinateToPixel(const Coordinate &coord) {
        auto x = static_cast<PixelType>(std::round(pixelCenter_.x + (coord.longitude * xPixelToDegreesRatio_)));

        double f = std::min<double>(
            std::max<double>(std::sin(coord.latitude * kRadiansToDegreesRatio), -0.9999),
            0.9999
        );
        auto y = static_cast<PixelType>(std::round(
            pixelCenter_.y + 0.5 * std::log((1.0 + f) / (1.0 - f)) * -yPixelToRadiansRatio_
        ));

        return Pixel{x, y};
    };

    Coordinate pixelToCoordinate(const Pixel &pixel) {
        float longitude = (pixel.x - pixelCenter_.x) / xPixelToDegreesRatio_;
        float latitude = (2.0 * std::atan(std::exp((pixel.y - pixelCenter_.y) / -yPixelToRadiansRatio_)) -
            std::numbers::pi / 2.0) * kDegreesToRadiansRatio;
        return {latitude, longitude};
    }

    [[nodiscard]] ZoomLevel zoomLevel() const { return zoomLevel_; };

private:
    const ZoomLevel zoomLevel_;
    PixelType pixelZoomWidth_{0};
    Pixel pixelCenter_{0, 0};
    double xPixelToDegreesRatio_{0.0};
    double yPixelToRadiansRatio_{0.0};
};

template<typename PixelType = float>
class LapTracjectoryConverter {
public:
    using Pixel = PixelBase<PixelType>;
    static constexpr bool kConvertToInteger = isPixelTypeInteger<PixelType>();

    explicit LapTracjectoryConverter(ZoomLevel zoomLevel = kZoomLevelDefault) :
        pixelConverter_(zoomLevel) {}

    PixelData<PixelType> toPixels(const LapTrajectory &trajectory) {
        auto &path = trajectory.path();
        auto geoPixels = std::accumulate(
            path.begin(),
            path.end(),
            std::vector<Pixel>{},
            [&](auto pixels, auto &point) {
                auto pixel = pixelConverter_.coordinateToPixel({point.latitude(), point.longitude()});
                pixels.push_back(pixel);
                return pixels;
            }
        );
        PixelType minX, maxX, minY, maxY;
        bool first = true;
        for (auto &[x,y] : geoPixels) {
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

        PixelData<PixelType> pixelData{.pixels = {}, .max = {maxX - minX, maxY - minY}};
        std::for_each(
            geoPixels.begin(),
            geoPixels.end(),
            [&](auto &geoPixel) {
                auto [x,y] = geoPixel;
                Pixel pixel{x - minX, y - minY};
                pixelData.pixels.push_back(pixel);
            }
        );

        return pixelData;
    };

    TrackMap toTrackMap(const LapTrajectory &trajectory) {
        auto pixelData = toPixels(trajectory);

        TrackMap tm;
        std::for_each(
            pixelData.pixels.begin(),
            pixelData.pixels.end(),
            [&](auto &pixel) {
                auto point = tm.add_points();
                point->set_x(pixel.x);
                point->set_y(pixel.y);
            }
        );
        auto size = tm.mutable_size();
        size->set_width(pixelData.max.x);
        size->set_height(pixelData.max.y);

        return tm;
    }

private:
    PixelConverter<PixelType> pixelConverter_;
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
