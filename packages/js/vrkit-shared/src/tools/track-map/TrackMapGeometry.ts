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

export interface ScaleTrackMapToFitConfig {
  padding: number
}

export type ScaleTrackMapToFitOptions = Partial<ScaleTrackMapToFitConfig>

const applyDefaultScaleTrackMapToFitConfig = (options: ScaleTrackMapToFitOptions):ScaleTrackMapToFitConfig => ({
  padding: 0,
  ...options
})

export function ScaleTrackMapToFit(trackMap: TrackMap, size: SizeF, options: ScaleTrackMapToFitOptions = {}): TrackMap {
  const config = applyDefaultScaleTrackMapToFitConfig(options),
      {padding} = config
  
  const
      dimPadding = 2 * padding,
      dimOffset = padding,
      paddedSize: SizeF = {
        width: size.width - dimPadding,
        height: size.height -dimPadding
      },
      scaled: TrackMap = TrackMap.create({
    ...trackMap,
    path: trackMap.path.map(point => LapCoordinate.create({...point})),
    scaledSize: {
      ...paddedSize
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
      x: dimOffset + (point.x * scaleRatio),
      y: dimOffset + (point.y * scaleRatio)
    })
    
    scaled.path[idx] = point
  }

  return scaled
}