import { OverlayInfo, OverlayKind, OverlayPlacement } from "vrkit-models"
import { OverlaySpecialIds } from "vrkit-app-common/models"
import { OverlayBrowserWindowType, overlayInfoToUniqueId } from "./OverlayManagerUtils"

function createVREditorOverlayPlacement(): OverlayPlacement {
  const screenRect = {
    size: {
      width: 200,
      height: 200
    },
    position: {
      x: 0,
      y: 0
    }
  }

  return OverlayPlacement.create({
    id: OverlaySpecialIds.VR_EDITOR,
    overlayId: OverlaySpecialIds.VR_EDITOR,
    screenRect,
    vrLayout: {
      pose: { x: -0.5, eyeY: -0.5, z: -1.0 },
      size: {
        width: 1.0,
        height: 1.0
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