import { OverlayConfig } from "vrkit-models"
import { createSimpleSchema, custom, list, object, primitive } from "serializr"

export interface OverlayVREditorState {
  selectedOverlayConfigId: string
}

export const OverlayVREditorStateSchema = createSimpleSchema<OverlayVREditorState>({
  selectedOverlayConfigId: primitive()
})



export interface OverlaysState {
  overlayConfigs:OverlayConfig[]
  editor?:OverlayVREditorState
}

export const OverlaysStateSchema = createSimpleSchema<OverlaysState>({
  overlayConfigs: list(custom(v => OverlayConfig.toJson(v ?? {}), v => OverlayConfig.fromJson(v ?? {}))),
  editor: object(OverlayVREditorStateSchema)
})

export function newOverlaysState():OverlaysState {
  return {
    overlayConfigs: [],
    editor: null
  }
}