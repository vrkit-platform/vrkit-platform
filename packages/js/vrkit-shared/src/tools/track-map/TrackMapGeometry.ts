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

import { LapCoordinate, SizeF, TrackMap } from "@vrkit-platform/models"

/**
 * Configuration interface for scaling and fitting a track map within a defined area.
 *
 * The ScaleTrackMapToFitConfig interface is used to define the parameters required
 * to adjust the scaling and ensure the map fits properly with specified padding values.
 *
 * Properties:
 * - `padding` (number): Defines the padding to be applied around the scaled map.
 *    This value ensures that the map does not touch the edges of the container
 *    and maintains consistent spacing.
 */
export interface ScaleTrackMapToFitConfig {
  padding: number
}

/**
 * Represents the options that may be provided for scaling the map to fit
 * within a specific track. This type is a partial version of the
 * `ScaleTrackMapToFitConfig` type, allowing for some or all properties
 * of the original configuration to be optional.
 *
 * Typically used to customize or override specific scaling behaviors
 * while retaining default settings from the main configuration.
 */
export type ScaleTrackMapToFitOptions = Partial<ScaleTrackMapToFitConfig>

const applyDefaultScaleTrackMapToFitConfig = (options: ScaleTrackMapToFitOptions): ScaleTrackMapToFitConfig => ({
  padding: 0,
  ...options
})

/**
 * Scales a given track map to fit within a specified size while maintaining aspect ratio.
 *
 * This method adjusts the size of the track map and its coordinates to fit within the provided dimensions,
 * applying optional padding. The result is a new track map object that is scaled accordingly.
 *
 * @param {TrackMap} trackMap - The track map to scale.
 * @param {SizeF} size - The target size into which the track map should fit.
 * @param {ScaleTrackMapToFitOptions} [options={}] - Optional configuration for scaling, including padding.
 * @return {TrackMap} A new scaled version of the provided track map.
 */
export function ScaleTrackMapToFit(trackMap: TrackMap, size: SizeF, options: ScaleTrackMapToFitOptions = {}): TrackMap {
  const config = applyDefaultScaleTrackMapToFitConfig(options), { padding } = config,
      dimPadding = 2 * padding,
      dimOffset = padding,
      paddedSize:SizeF = {
        width: size.width - dimPadding, height: size.height - dimPadding
      },
      scaled:TrackMap = TrackMap.create({
        ...trackMap,
        path: trackMap.path.map(point => LapCoordinate.create({ ...point })),
        scaledSize: {
          ...paddedSize
        }
      }), { scaledSize } = scaled,
      scaleX = scaledSize.width / trackMap.size.width,
      scaleY = scaledSize.height / trackMap.size.height,
      scaleRatio = (
          scaled.scaledRatio = Math.min(scaleX, scaleY)
      ),
      pointCount = scaled.path.length
  
  
  for (let idx = 0; idx < pointCount; idx++) {
    const point = LapCoordinate.create(scaled.path[idx])
    Object.assign(point, {
      x: dimOffset + point.x * scaleRatio,
      y: dimOffset + point.y * scaleRatio
    })

    scaled.path[idx] = point
  }

  return scaled
}
