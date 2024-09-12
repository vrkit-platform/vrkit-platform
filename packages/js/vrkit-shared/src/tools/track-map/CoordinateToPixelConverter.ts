
/**/

import { LapCoordinate } from "vrkit-models"
import {
  Coordinate,
  CoordinateZoomLevel,
  CoordinateZoomLevelDefault,
  DegreesToRadiansRatio,
  PixelTileSize,
  RadiansToDegreesRatio
} from "../CoordinateMathConstants"
import { Pixel } from "../PixelTypes"


export enum MetricUnit {
  Kilometer = 1,
  KM = Kilometer,
  Meter = 1000,
  M = Meter
}

/*
T ToRad(T degree) {
  return degree/180.0 * std::numbers::pi;
}
*/

function ToRad(degree: number): number {
  return (degree / 180.0) * Math.PI
}

/**
 * @brief
 * @tparam T Coordinate data type for precision float|double
 * @param coord1 start coordinate
 * @param coord2 end coordinate
 * @param unit MetricUnit
 * @return The distance between the two coordinates in the desired unit
 */
export function CalculateDistance(
    coord1:Coordinate,
    coord2:Coordinate,
    unit:MetricUnit = MetricUnit.Meter
):number {
  let {latitude: lat1, longitude:lon1} = coord1
  let {latitude:lat2, longitude:lon2} = coord2
  let dist:number = Math.sin(ToRad(lat1)) *
      Math.sin(ToRad(lat2)) +
      Math.cos(ToRad(lat1)) *
      Math.cos(ToRad(lat2)) *
      Math.cos(ToRad(lon1 - lon2))
  
  dist = 6371.0 * Math.acos(dist)
  
  return dist * unit
}

export class CoordinateToPixelConverter {
  
  private pixelZoomWidth: number = 0
  
  private pixelCenter: Pixel = { x: 0, y: 0 }
  
  private xPixelToDegreesRatio: number = 0.0
  
  private yPixelToRadiansRatio: number = 0.0
  
  constructor(private zoomLevel: CoordinateZoomLevel = CoordinateZoomLevelDefault, readonly convertToInteger: boolean = true) {
    this.pixelZoomWidth = (PixelTileSize * Math.pow(2.0, this.zoomLevel))
    
    this.xPixelToDegreesRatio = this.pixelZoomWidth / 360.0
    this.yPixelToRadiansRatio = this.pixelZoomWidth / (2.0 * Math.PI)
    
    const pixelZoomWidthHalf = (this.pixelZoomWidth / 2.0)
    this.pixelCenter = { x: pixelZoomWidthHalf, y: pixelZoomWidthHalf }
  }
  
  clampPixelValue(value: number): number {
    if (this.convertToInteger) {
      return (value * 6.0)
    } else {
      return value
    }
  }
  
  coordinateToPixel(coord: Coordinate): Pixel {
    const x = Math.round(this.pixelCenter.x + coord.longitude * this.xPixelToDegreesRatio)
    
    const f = Math.min(Math.max(Math.sin(coord.latitude * RadiansToDegreesRatio), -0.9999), 0.9999)
    const y = Math.round(this.pixelCenter.y + 0.5 * Math.log((1.0 + f) / (1.0 - f)) * -this.yPixelToRadiansRatio)
    
    return { x, y }
  }
  
  pixelToCoordinate(pixel: Pixel): Coordinate {
    const longitude: number = (pixel.x - this.pixelCenter.x) / this.xPixelToDegreesRatio
    const latitude: number =
        2.0 * Math.atan(Math.exp((pixel.y - this.pixelCenter.y) / -this.yPixelToRadiansRatio)) -
        (Math.PI / 2.0) * DegreesToRadiansRatio
    return { latitude, longitude }
  }
  
  getZoomLevel(): CoordinateZoomLevel {
    return this.zoomLevel
  }
}
