import { OverlayInfo, OverlayKind, OverlayPlacement, RectI } from "vrkit-models"
import { OverlaySpecialIds } from "vrkit-app-common/models"
import { OverlayBrowserWindowType, overlayInfoToUniqueId } from "./OverlayManagerUtils"

export function defaultScreenRect(width:number = 200, height: number = 200) {
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

function createVREditorInfoOverlayPlacement(): OverlayPlacement {
  const screenRect = defaultScreenRect(400,400)

  return OverlayPlacement.create({
    id: OverlaySpecialIds.VR_EDITOR_INFO,
    overlayId: OverlaySpecialIds.VR_EDITOR_INFO,
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

export const VREditorInfoOverlayPlacement = createVREditorInfoOverlayPlacement()

function createVREditorInfoOverlayInfo(): OverlayInfo {
  return OverlayInfo.create({
    id: OverlaySpecialIds.VR_EDITOR_INFO,
    kind: OverlayKind.VR_EDITOR_INFO,
    name: OverlaySpecialIds.VR_EDITOR_INFO,
    description: OverlaySpecialIds.VR_EDITOR_INFO,
    dataVarNames: [],
    settings: {
      fps: 10
    }
  })
}

export const VREditorInfoOverlayInfo = createVREditorInfoOverlayInfo()

export const VREditorInfoOverlayOUID = overlayInfoToUniqueId(VREditorInfoOverlayInfo, OverlayBrowserWindowType.VR)


function createScreenEditorInfoOverlayPlacement(): OverlayPlacement {
  const screenRect = defaultScreenRect(400,400)
  
  return OverlayPlacement.create({
    id: OverlaySpecialIds.SCREEN_EDITOR_INFO,
    overlayId: OverlaySpecialIds.SCREEN_EDITOR_INFO,
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

export const ScreenEditorInfoOverlayPlacement = createScreenEditorInfoOverlayPlacement()

function createScreenEditorInfoOverlayInfo(): OverlayInfo {
  return OverlayInfo.create({
    id: OverlaySpecialIds.SCREEN_EDITOR_INFO,
    kind: OverlayKind.SCREEN_EDITOR_INFO,
    name: OverlaySpecialIds.SCREEN_EDITOR_INFO,
    description: OverlaySpecialIds.SCREEN_EDITOR_INFO,
    dataVarNames: [],
    settings: {
      fps: 10
    }
  })
}

export const ScreenEditorInfoOverlayInfo = createScreenEditorInfoOverlayInfo()

export const ScreenEditorInfoOverlayOUID = overlayInfoToUniqueId(ScreenEditorInfoOverlayInfo, OverlayBrowserWindowType.SCREEN)