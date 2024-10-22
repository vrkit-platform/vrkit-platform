import { OverlayConfig } from "vrkit-models"
import { Props, createSimpleSchema, custom, list, object, primitive } from "serializr"
import { valuesOf } from "../../utils"
import { uniq } from "lodash"

export enum OverlayVREditorProperty {
  x = "x",
  y = "y",
  width = "width",
  height = "height"
}

export type OverlayVREditorPropertyName = OverlayVREditorProperty | `${OverlayVREditorProperty}`
export const OverlayVREditorPropertyNames = uniq(valuesOf(OverlayVREditorProperty)) as Array<OverlayVREditorPropertyName>

export interface OverlayVREditorState {
  selectedOverlayConfigId: string
  selectedOverlayConfigProp: OverlayVREditorPropertyName
  enabled: boolean
}

export const OverlayVREditorStateSchema = createSimpleSchema<OverlayVREditorState>({
  selectedOverlayConfigId: primitive(),
  selectedOverlayConfigProp: primitive(),
  enabled: primitive()
})

export function newOverlayVREditorState():OverlayVREditorState {
  return {
    selectedOverlayConfigId:  "",
    selectedOverlayConfigProp:  "x",
    enabled: false
  }
}


export interface OverlaysState {
  //overlayConfigs:OverlayConfig[]
  editor:OverlayVREditorState
}

export const OverlaysStateSchema = createSimpleSchema<OverlaysState>({
  //overlayConfigs: list(custom(v => OverlayConfig.toJson(v ?? {}), v => OverlayConfig.fromJson(v ?? {}))),
  editor: object(OverlayVREditorStateSchema)
})

export function newOverlaysState():OverlaysState {
  return {
    //overlayConfigs: [],
    editor: newOverlayVREditorState()
  }
}