
/**/

import { asOption } from "@3fv/prelude-ts"
import {
  Coordinate,
  CoordinateZoomLevel,
  CoordinateZoomLevelDefault,
  DegreesToRadiansRatio,
  PixelTileSize,
  RadiansToDegreesRatio
} from "../CoordinateMathConstants"
import { Pixel } from "../PixelTypes"
import {
  CalculateDistance,
  CoordinateToPixelConverter
} from "./CoordinateToPixelConverter"
import { LapCoordinate, LapTrajectory, TrackMap } from "vrkit-models"


export interface LapCoordinateStep {
  coordinate: LapCoordinate
  meters: number
}

export interface LapCoordinateData {
  steps: LapCoordinateStep[]

  max: Pixel
  
  meters: number
}

export class LapTrajectoryConverter {
  
  private pixelConverter: CoordinateToPixelConverter
  
  constructor(readonly zoomLevel: number, readonly convertToInteger: boolean = true) {
    this.pixelConverter = new CoordinateToPixelConverter(zoomLevel, this.convertToInteger)
  }
  
  populateXYData(trajectory: LapTrajectory):LapCoordinateData {
    let path = trajectory.path
    let previousCoord: Coordinate = null
    let totalMeters = 0
    
    let lapCoordSteps = path.reduce((steps: LapCoordinateStep[], point: LapCoordinate) => {
      // Simple Coordinate
      let coord: Coordinate = {
        latitude: point.latitude,
        longitude: point.longitude
      }

      // Convert geographic data to x/y pixels
      const pixel = this.pixelConverter.coordinateToPixel(coord)

      const pointCopy = { ...point,
        ...pixel
      }
      
      steps.push({
        coordinate: pointCopy,
        meters: previousCoord ? asOption(CalculateDistance(previousCoord, coord))
            .tap(meters => {
              totalMeters += meters
            }).getOrThrow() : 0.0
      })

      previousCoord = coord

      return steps
    }, [])
    
    

    let minX: number, maxX: number, minY: number, maxY: number
    let first: boolean = true
    for (let step of lapCoordSteps) {
      let x = step.coordinate.x
      let y = step.coordinate.y
      if (first) {
        minX = maxX = x
        minY = maxY = y
        first = false
      } else {
        if (x < minX) {
          minX = x
        }

        if (y < minY) {
          minY = y
        }

        if (x > maxX) {
          maxX = x
        }

        if (y > maxY) {
          maxY = y
        }
      }
    }

    const pathData: LapCoordinateData = {
      steps: [],
      max: {
        x: maxX - minX,
        y: maxY - minY
      },
      meters: totalMeters
    }

    lapCoordSteps.forEach((lapCoordStep: LapCoordinateStep) => {
      const x = lapCoordStep.coordinate.x
      const y = lapCoordStep.coordinate.y
      
      const lapCoordAdjusted: LapCoordinate = {
        ...lapCoordStep.coordinate,
        x: x - minX,
        y: y - minY,
        lapDistanceCalculated: lapCoordStep.meters
      }
      
      pathData.steps.push({
        coordinate: lapCoordAdjusted,
        meters: lapCoordStep.meters
      })
    })

    return pathData
  }
  
  toTrackMap(trajectory: LapTrajectory): TrackMap {
    
    const pathData = this.populateXYData(trajectory)

    return TrackMap.create({
      path: pathData.steps.map(step => LapCoordinate.create(step.coordinate)),
      size: {
        width: pathData.max.x,
        height: pathData.max.y,
      },
      totalDistance: pathData.meters,
      trackLayoutMetadata: trajectory.trackLayoutMetadata
    })
  }
  
  
}

export {}