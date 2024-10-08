import {
  OverlayInfo,
  OverlayKind,
  OverlayPlacement,
  RectI, VRPose
} from "vrkit-models"
import { OverlaySpecialIds } from "./OverlayDataTypes"
import { OverlayBrowserWindowType, overlayInfoToUniqueId } from "./OverlayManagerUtils"
import { pairOf } from "vrkit-app-common/utils"

export function defaultScreenRect(width:number = 400, height: number = 400) {
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

function defaultEditorInfoVRPose():VRPose {
  return VRPose.create({ x: -0.35, eyeY: -0.35, z: -1.0 })
}

function createEditorInfoOverlayPlacement(): OverlayPlacement {
  const screenRect = defaultScreenRect()
  
  return OverlayPlacement.create({
    id: OverlaySpecialIds.EDITOR_INFO,
    overlayId: OverlaySpecialIds.EDITOR_INFO,
    screenRect,
    vrLayout: {
      // pose: { x: -0.5, eyeY: 0, z: -1.0 },
      pose: defaultEditorInfoVRPose(),
      size: {
        width: 0.75,
        height: 0.75
      },
      screenRect
    }
  })
}

export const EditorInfoOverlayPlacement = createEditorInfoOverlayPlacement()

function createEditorInfoOverlayInfo(): OverlayInfo {
  return OverlayInfo.create({
    id: OverlaySpecialIds.EDITOR_INFO,
    kind: OverlayKind.EDITOR_INFO,
    name: OverlaySpecialIds.EDITOR_INFO,
    description: OverlaySpecialIds.EDITOR_INFO,
    dataVarNames: [],
    settings: {
      fps: 10
    }
  })
}

export const EditorInfoOverlayInfo = createEditorInfoOverlayInfo()

export const EditorInfoScreenOverlayOUID = overlayInfoToUniqueId(EditorInfoOverlayInfo, OverlayBrowserWindowType.SCREEN)
export const EditorInfoVROverlayOUID = overlayInfoToUniqueId(EditorInfoOverlayInfo, OverlayBrowserWindowType.VR)

export const EditorInfoOverlayOUIDs = pairOf(EditorInfoVROverlayOUID, EditorInfoScreenOverlayOUID)

export function isEditorInfoOUID(id: string) {
  return EditorInfoOverlayOUIDs.includes(id)
}
