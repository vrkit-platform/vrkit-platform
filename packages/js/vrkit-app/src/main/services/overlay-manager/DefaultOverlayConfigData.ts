import { OverlayInfo, OverlayKind, OverlayPlacement, RectI } from "vrkit-models"
import { OverlaySpecialIds } from "vrkit-app-common/models"
import { OverlayBrowserWindowType, overlayInfoToUniqueId } from "./OverlayManagerUtils"

export function defaultVRScreenRect(width:number = 200, height: number = 200) {
  return {
    size: {
      width,
      height
    },
    position: {
      x: 0,
      y: 0
    }
  } as RectI
}

function createVREditorOverlayPlacement(): OverlayPlacement {
  const screenRect = defaultVRScreenRect(400,400)

  return OverlayPlacement.create({
    id: OverlaySpecialIds.VR_EDITOR,
    overlayId: OverlaySpecialIds.VR_EDITOR,
    screenRect,
    vrLayout: {
      // pose: { x: -0.5, eyeY: 0, z: -1.0 },
      pose: { x: 0.5, eyeY: 0.25, z: -1.0 },
      size: {
        width: 0.75,
        height: 0.75
      },
      screenRect
    }
  })
}

export const VREditorOverlayPlacement = createVREditorOverlayPlacement()

function createVREditorOverlayInfo(): OverlayInfo {
  return OverlayInfo.create({
    id: OverlaySpecialIds.VR_EDITOR,
    kind: OverlayKind.VR_EDITOR,
    name: OverlaySpecialIds.VR_EDITOR,
    description: OverlaySpecialIds.VR_EDITOR,
    dataVarNames: [],
    settings: {
      fps: 10
    }
  })
}

export const VREditorOverlayInfo = createVREditorOverlayInfo()

export const VREditorOverlayOUID = overlayInfoToUniqueId(VREditorOverlayInfo, OverlayBrowserWindowType.VR)