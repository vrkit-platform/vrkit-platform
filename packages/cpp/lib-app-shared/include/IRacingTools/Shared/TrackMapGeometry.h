#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <algorithm>
#include <numeric>


#include <IRacingTools/Models/LapTrajectory.pb.h>
#include <IRacingTools/Models/TrackMap.pb.h>

#include <IRacingTools/Shared/Graphics/CoordinateToPixelConverter.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::Geometry {

  using namespace Models;

  template<typename PixelType = float>
  class LapTrajectoryConverter {
  public:
    using Pixel = PixelBase<PixelType>;

    struct LapCoordinateStep {
      LapCoordinate coordinate;
      double meters;
    };

    struct LapCoordinateData {
      std::vector<LapCoordinateStep> steps;
      Pixel max;
    };

    static constexpr bool kConvertToInteger = isPixelTypeInteger<PixelType>();

    explicit LapTrajectoryConverter(ZoomLevel zoomLevel = kZoomLevelDefault)
        : pixelConverter_(zoomLevel) {
    }

    LapCoordinateData populateXYData(const LapTrajectory &trajectory) {
      auto &path = trajectory.path();
      std::optional<Coordinate<double>> previousCoord{std::nullopt};
      auto lapCoordSteps = std::accumulate(
          path.begin(),
          path.end(),
          std::vector<LapCoordinateStep>{},
          [&](auto steps, auto &point) {
            // Simple Coordinate
            Coordinate<double> coord{point.latitude(), point.longitude()};

            // Convert geographic data to x/y pixels
            auto pixel = pixelConverter_.coordinateToPixel(coord);


            auto pointCopy = point;
            pointCopy.set_x(pixel.x);
            pointCopy.set_y(pixel.y);

            steps.push_back(
                {.coordinate = pointCopy,
                 .meters = previousCoord
                               ? CalculateDistance(previousCoord.value(), coord)
                               : 0.0});
            previousCoord = coord;
            // pixels.push_back(pixel);
            return steps;
          });
      PixelType minX, maxX, minY, maxY;
      bool first = true;
      for (auto &step: lapCoordSteps) {
        auto x = step.coordinate.x();
        auto y = step.coordinate.y();
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

      LapCoordinateData pathData{
          .steps = {}, .max = {maxX - minX, maxY - minY}};
      std::for_each(
          lapCoordSteps.begin(), lapCoordSteps.end(), [&](auto &lapCoordStep) {
            auto x = lapCoordStep.coordinate.x();
            auto y = lapCoordStep.coordinate.y();

            LapCoordinate lapCoordAdjusted(lapCoordStep.coordinate);
            lapCoordAdjusted.set_x(x - minX);
            lapCoordAdjusted.set_y(y - minY);
            lapCoordAdjusted.set_lap_distance_calculated(lapCoordStep.meters);

            pathData.steps.push_back(LapCoordinateStep{
                .coordinate = lapCoordAdjusted, .meters = lapCoordStep.meters});
          });

      return pathData;
    };

    TrackMap toTrackMap(const LapTrajectory &trajectory) {
      auto pathData = populateXYData(trajectory);

      TrackMap tm;
      std::for_each(
          pathData.steps.begin(), pathData.steps.end(), [&](auto &step) {
            auto point = tm.add_path();
            point->CopyFrom(step.coordinate);
          });
      auto size = tm.mutable_size();
      size->set_width(pathData.max.x);
      size->set_height(pathData.max.y);

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

  TrackMap ToTrackMap(
      const LapTrajectory &lapTrajectory,
      ZoomLevel zoomLevel = kZoomLevelDefault);

  TrackMap ScaleTrackMapToFit(const TrackMap &trackMap, const Size<UINT> &size);

  std::optional<TrackMap>
  LoadTrackMapFromTrajectoryFile(const std::filesystem::path &path);
} // namespace IRacingTools::Shared::Geometry
