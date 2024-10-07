import { DashboardConfig, OverlayBaseSettings, OverlayInfo, OverlayKind } from "vrkit-models"
import { defaults, generateUUID } from "vrkit-app-common/utils"

export function newDashboardTrackMapMockConfig(name: string = "DefaultDashboardConfig"): DashboardConfig {
  const trackMapOverlay = newTrackMapOverlayInfo(`${name}-overlay-trackmap`),
    clockOverlay = newClockOverlayInfo(`${name}-overlay-clock`)

  return DashboardConfig.create({
    id: generateUUID(),
    name,
    description: "Default",
    screenId: "screen0", // TODO: think through screen config or remove it
    vrEnabled: true,
    screenEnabled: true,
    overlays: [trackMapOverlay, clockOverlay],
    placements: [
      {
        id: "track-map-placement-0",
        overlayId: trackMapOverlay.id,
        screenRect: {
          size: {
            width: 400,
            height: 400
          },
          position: {
            x: 0,
            y: 0
          }
        },
        vrLayout: {
          pose: {
            x: 0.25,
            eyeY: 0.0,
            z: -1.0
          },
          size: {
            width: 0.5,
            height: 0.5
          },
          screenRect: {
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
      },
      {
        id: "clock-placement-0",
        overlayId: clockOverlay.id,
        screenRect: {
          size: {
            width: 253,
            height: 32
          },
          position: {
            x: 2511
          }
        },
        vrLayout: {
          pose: { x: 0.25, eyeY: 0.0, z: -1.0 },
          size: {
            width: 0.5,
            height: 0.5
          },
          screenRect: {
            size: {
              width: 253,
              height: 32
            },
            position: {
              x: 0,
              y: 0
            }
          }
        }
      }
    ]
  })
}

export function newOverlayInfo(
  name: string,
  kind: OverlayKind,
  dataVarNames: string[] = [],
  settings: Partial<OverlayBaseSettings> = { fps: 10 }
) {
  return OverlayInfo.create({
    id: generateUUID(),
    kind,
    name,
    description: "Default",
    dataVarNames,
    settings: defaults(settings, {
      fps: 10
    })
  })
}

export function newClockOverlayInfo(name: string = "clock"): OverlayInfo {
  return newOverlayInfo(name, OverlayKind.CLOCK)
}

export function newTrackMapOverlayInfo(name: string = "track-map"): OverlayInfo {
  return newOverlayInfo(name, OverlayKind.TRACK_MAP, [
    "PlayerCarIdx",
    "CarIdxLap",
    "CarIdxLapCompleted",
    "CarIdxPosition",
    "CarIdxClassPosition",
    "CarIdxEstTime",
    "CarIdxLapDistPct"
  ])
}
