import { DashboardConfig, OverlayBaseSettings, OverlayInfo, OverlayKind } from "@vrkit-platform/models"
import {
  assignDeep,
  defaults,
  generateUUID, isNotEmptyString
} from "@vrkit-platform/shared"
import {
  VRKPluginInternalOverlayClockId,
  VRKPluginInternalOverlayTrackMapId
} from "@vrkit-platform/plugin-sdk"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export function newDashboardTrackMapMockConfig(patch: Partial<DashboardConfig>): DashboardConfig {
  log.assert(isNotEmptyString(patch?.name), "A name must be provided")
  const { name } = patch,
    trackMapOverlay = newTrackMapOverlayInfo(),
    clockOverlay = newClockOverlayInfo()

  return DashboardConfig.create(assignDeep({
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
            x: 2511,
            y: 0
          }
        },
        vrLayout: {
          pose: { x: 0.25, eyeY: 0.0, z: -1.0 },
          size: {
            width: 0.5,
            height: 0.06
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
  },patch))
}

export function newOverlayInfo(
  name: string,
  kind: OverlayKind,
  componentId:string,
  dataVarNames: string[] = [],
  settings: Partial<OverlayBaseSettings> = {  },
) {
  return OverlayInfo.create({
    id:generateUUID(),
    kind,
    componentId,
    name,
    description: "Default",
    dataVarNames,
    settings: defaults({...settings}, {
      fps: 10
    })
  })
}



export function newClockOverlayInfo(name: string = "clock"): OverlayInfo {
  return newOverlayInfo(name, OverlayKind.PLUGIN,VRKPluginInternalOverlayClockId,[],{})
}

export function newTrackMapOverlayInfo(name: string = "track-map"): OverlayInfo {
  return newOverlayInfo(name, OverlayKind.PLUGIN,VRKPluginInternalOverlayTrackMapId, [
    "PlayerCarIdx",
    "CarIdxLap",
    "CarIdxLapCompleted",
    "CarIdxPosition",
    "CarIdxClassPosition",
    "CarIdxEstTime",
    "CarIdxLapDistPct"
  ],{})
}
