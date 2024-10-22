import { OverlayInfo, OverlayKind, OverlayPlacement, RectI, SizeF, SizeI, VRPose } from "vrkit-models"
import { OverlaySpecialIds } from "./OverlayDataTypes"
import { OverlayBrowserWindowType, overlayInfoToUniqueId } from "./OverlayManagerUtils"
import { pairOf } from "../../utils"

export const EditorInfoDefaultScreenSize = SizeI.create({
  width: 500,
  height: 570
})

export const EditorInfoDefaultAspectRatio = EditorInfoDefaultScreenSize.height / EditorInfoDefaultScreenSize.width

export const EditorInfoDefaultVRWidth = 0.45

export const EditorInfoDefaultVRSize = SizeF.create({
  width: EditorInfoDefaultVRWidth,
  height: EditorInfoDefaultVRWidth * EditorInfoDefaultAspectRatio
})

export function defaultScreenRect(
  width: number = EditorInfoDefaultScreenSize.width,
  height: number = EditorInfoDefaultScreenSize.height
) {
  return RectI.create({
    size: {
      width,
      height
    },
    position: {
      x: 0,
      y: 0
    }
  }) as RectI
}

function defaultEditorInfoVRPose(): VRPose {
  return VRPose.create({
    x: 0 - EditorInfoDefaultVRSize.width / 2,
    eyeY: EditorInfoDefaultVRSize.height / 2,
    z: -1.0
  })
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
      size: SizeF.clone(EditorInfoDefaultVRSize),
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
