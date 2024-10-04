import { OverlayConfig } from "vrkit-models"
import { Props, createSimpleSchema, custom, list, object, primitive } from "serializr"

export interface OverlayVREditorState {
  selectedOverlayConfigId: string
  enabled: boolean
}

export const OverlayVREditorStateSchema = createSimpleSchema<OverlayVREditorState>({
  selectedOverlayConfigId: primitive(),
  enabled: primitive()
})

export function newOverlayVREditorState():OverlayVREditorState {
  return {
    selectedOverlayConfigId:  "",
    enabled: false
  }
}


export interface OverlaysState {
  overlayConfigs:OverlayConfig[]
  editor:OverlayVREditorState
}

export const OverlaysStateSchema = createSimpleSchema<OverlaysState>({
  overlayConfigs: list(custom(v => OverlayConfig.toJson(v ?? {}), v => OverlayConfig.fromJson(v ?? {}))),
  editor: object(OverlayVREditorStateSchema)
})

export function newOverlaysState():OverlaysState {
  return {
    overlayConfigs: [],
    editor: newOverlayVREditorState()
  }
}