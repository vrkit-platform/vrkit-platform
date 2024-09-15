import { DashboardConfig, OverlayInfo, OverlayKind } from "vrkit-models"
import { generateUUID } from "vrkit-app-common/utils"

export function newDashboardTrackMapMockConfig(name: string = "DefaultDashboardConfig"): DashboardConfig {
  const trackMapOverlay = newTrackMapOverlay(`${name}-overlay-trackmap`)

  return {
    id: generateUUID(),
    name,
    description: "Default",
    screenId: "screen0", // TODO:
    // implement
    // or
    // remove

    overlays: [trackMapOverlay],
    placements: [
      {
        id: "track-map-placement-0",
        overlayId: "track-map-0",
        rect: {
          size: {
            width: 400,
            height: 400
          },
          position: {
            x: 0,
            y: 0
          }
        }
      }
    ]
  }
}

export function newTrackMapOverlay(name = "track-map"): OverlayInfo {
  return {
    id: generateUUID(),
    kind: OverlayKind.TRACK_MAP,
    name,
    description: "Default",
    dataVarNames: [
      "PlayerCarIdx",
      "CarIdxLap",
      "CarIdxLapCompleted",
      "CarIdxPosition",
      "CarIdxClassPosition",
      "CarIdxEstTime",
      "CarIdxLapDistPct"
    ],
    settings: {
      fps: 10
    }
  }
}
