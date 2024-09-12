/*
TrackMap ScaleTrackMapToFit(const TrackMap &trackMap, const Size<UINT> &size) {
  TrackMap scaled(trackMap);
  
  auto scaledSize = scaled.mutable_scaled_size();
  
  scaledSize->set_width(static_cast<float>(size.width()));
  scaledSize->set_height(static_cast<float>(size.height()));
  
  
  float scaleX = scaledSize->width() / trackMap.size().width();
  float scaleY = scaledSize->height() / trackMap.size().height();
  float scaleRatio = std::min<float>(scaleX, scaleY);
  scaled.set_scaled_ratio(scaleRatio);
  
  auto pointCount = scaled.path_size();
  for (int idx = 0; idx < pointCount; idx++) {
    auto point = scaled.mutable_path(idx);
    point->set_x(point->x() * scaleRatio);
    point->set_y(point->y() * scaleRatio);
  }
  
  return scaled;
}
*/

import { LapCoordinate, SizeF, TrackMap } from "vrkit-models"
import { Size } from "../CoordinateMathConstants"

export function ScaleTrackMapToFit(trackMap: TrackMap, size: SizeF): TrackMap {
  const scaled: TrackMap = TrackMap.create({
    ...trackMap,
    path: trackMap.path.map(point => LapCoordinate.create({...point})),
    scaledSize: {
      ...size
    }
  })
  
  const { scaledSize } = scaled

  const scaleX: number = scaledSize.width / trackMap.size.width
  const scaleY: number = scaledSize.height / trackMap.size.height
  const scaleRatio: number = scaled.scaledRatio = Math.min(scaleX, scaleY)
 
  
  const pointCount = scaled.path.length
  for (let idx = 0; idx < pointCount; idx++) {
    const point = LapCoordinate.create(scaled.path[idx])
    Object.assign(point, {
      x: point.x * scaleRatio,
      y: point.y * scaleRatio
    })
    
    scaled.path[idx] = point
  }

  return scaled
}