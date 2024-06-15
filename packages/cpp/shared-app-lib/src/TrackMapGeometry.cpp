//
// Created by jglanz on 1/18/2024.
//
#include <IRacingTools/Shared/TrackMapGeometry.h>

namespace IRacingTools::Shared::Geometry {

TrackMap ToTrackMap(const LapTrajectory &lapTrajectory, ZoomLevel zoomLevel) {
    return LapTracjectoryConverter(zoomLevel).toTrackMap(lapTrajectory);
}

TrackMap ScaleTrackMapToFit(const TrackMap &trackMap, const Size<UINT> &size) {
  TrackMap scaled(trackMap);

  auto scaledSize = scaled.mutable_scaled_size();

  scaledSize->set_width(static_cast<float>(size.width()));
  scaledSize->set_height(static_cast<float>(size.height()));


  float scaleX = scaledSize->width() / trackMap.size().width();
  float scaleY = scaledSize->height() / trackMap.size().height();
  float scaleRatio = std::min<float>(scaleX, scaleY);
  scaled.set_scaled_ratio(scaleRatio);

  auto pointCount = scaled.points_size();
  for (int idx = 0; idx < pointCount; idx++) {
    auto point = scaled.mutable_points(idx);
    point->set_x(point->x() * scaleRatio);
    point->set_y(point->y() * scaleRatio);
  }

  return scaled;
}

std::optional<TrackMap> LoadTrackMapFromTrajectoryFile(const std::filesystem::path &path) {
  auto ltResult = IRacingTools::Shared::Utils::ReadMessageFromFile<LapTrajectory>(path);
  if (!ltResult)
    return std::nullopt;
  auto &lt = ltResult.value();
  return ToTrackMap(lt);
}
}// namespace IRacingTools::Shared::Geometry
