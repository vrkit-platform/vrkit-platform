import { SizeF } from "@vrkit-platform/models"
export type CoordinateZoomLevel = number
export const CoordinateZoomLevelDefault:CoordinateZoomLevel = 20

export const PixelTileSize = 256.0;
export const DegreesToRadiansRatio = 180.0 / Math.PI;
export const RadiansToDegreesRatio = Math.PI / 180.0;

export interface Coordinate {
  latitude:number
  longitude:number
}

export type Size = SizeF