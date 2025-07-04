#pragma once


#include <algorithm>
#include <filesystem>
#include <magic_enum/magic_enum.hpp>
#include <numbers>
#include <type_traits>

namespace VRKit::Shared::Geometry {
  using ZoomLevel = size_t;
  constexpr ZoomLevel kZoomLevelDefault = 20;

  constexpr double kPixelTileSize = 256.0;
  constexpr double kDegreesToRadiansRatio = 180.0 / std::numbers::pi;
  constexpr double kRadiansToDegreesRatio = std::numbers::pi / 180.0;

  template <typename T = double>
  struct Coordinate {
    T latitude;
    T longitude;
  };


  template <typename T>
  T ToRad(T degree) {
    return degree / 180.0 * std::numbers::pi;
  }

  enum class MetricUnit {
    Kilometer = 1,
    KM = Kilometer,
    Meter = 1000,
    M = Meter
  };

  /**
   * \brief
   * \tparam T Coordinate data type for precision float|double
   * \param coord1 start coordinate
   * \param coord2 end coordinate
   * \param unit MetricUnit
   * \return The distance between the two coordinates in the desired unit
   */
  template <typename T = double>
  T CalculateDistance(Coordinate<T> coord1, Coordinate<T> coord2, MetricUnit unit = MetricUnit::Meter) {
    auto [lat1, lon1] = coord1;
    auto [lat2, lon2] = coord2;
    T dist = std::sin(ToRad(lat1)) * std::sin(ToRad(lat2)) + std::cos(ToRad(lat1)) * std::cos(ToRad(lat2)) * std::cos(
      ToRad(lon1 - lon2)
    );

    dist = static_cast<T>(6371.0) * std::acos(dist);

    auto unitMultiplier = static_cast<T>(magic_enum::enum_underlying(unit));
    return dist * static_cast<T>(unitMultiplier);
  }

  template <typename T>
  struct PixelBase {
    T x;
    T y;
  };


  using PixelF = PixelBase<float>;
  using PixelD = PixelBase<double>;
  using PixelI = PixelBase<int>;

  template <typename T>
  constexpr bool isPixelTypeInteger() {
    if constexpr (std::is_same_v<T, float> || std::is_same_v<T, double>) {
      return false;
    }

    return true;
  }

  template <typename PixelType = float>
  class CoordinateToPixelConverter {
    public:

      using Pixel = PixelBase<PixelType>;
      static constexpr bool kConvertToInteger = !isPixelTypeInteger<PixelType>();

      PixelType clampPixelValue(double value) {
        PixelType outValue;
        if (kConvertToInteger) {
          outValue = static_cast<PixelType>(value * 6.0);
        } else {
          outValue = static_cast<PixelType>(value);
        }
        return outValue;
      }

      explicit CoordinateToPixelConverter(ZoomLevel zoomLevel = kZoomLevelDefault) : zoomLevel_(zoomLevel) {
        pixelZoomWidth_ = kPixelTileSize * pow(2.0, static_cast<double>(zoomLevel));

        xPixelToDegreesRatio_ = pixelZoomWidth_ / 360.0;
        yPixelToRadiansRatio_ = pixelZoomWidth_ / (2.0 * std::numbers::pi);

        PixelType pixelZoomWidthHalf = pixelZoomWidth_ / static_cast<PixelType>(2.0);
        pixelCenter_ = {pixelZoomWidthHalf, pixelZoomWidthHalf};
      };

      Pixel coordinateToPixel(const Coordinate<>& coord) {
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

      Coordinate<> pixelToCoordinate(const Pixel& pixel) {
        float longitude = (pixel.x - pixelCenter_.x) / xPixelToDegreesRatio_;
        float latitude = (2.0 * std::atan(std::exp((pixel.y - pixelCenter_.y) / -yPixelToRadiansRatio_)) -
          std::numbers::pi / 2.0) * kDegreesToRadiansRatio;
        return {latitude, longitude};
      }

      [[nodiscard]] ZoomLevel zoomLevel() const {
        return zoomLevel_;
      };

    private:

      const ZoomLevel zoomLevel_;
      PixelType pixelZoomWidth_{0};
      Pixel pixelCenter_{0, 0};
      double xPixelToDegreesRatio_{0.0};
      double yPixelToRadiansRatio_{0.0};
  };
}
