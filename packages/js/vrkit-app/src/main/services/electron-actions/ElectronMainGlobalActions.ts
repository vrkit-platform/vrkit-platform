import { ActionDef, ActionType } from "@vrkit-platform/shared"
import {
  GlobalActionId,
  GlobalActionIdName
} from "@vrkit-platform/shared"

export const ElectronMainGlobalActions = Object.fromEntries(Array<ActionDef>({
  id: GlobalActionId.toggleOverlayEditor,
  type: ActionType.Global,
  runtime: "main",
  alwaysEnabled: true,
  name: "Toggle Overlay Edit Mode",
  defaultAccelerators: ["Control+Alt+F9"]
}, {
  id: GlobalActionId.switchOverlayVREditorInfoAnchor,
  type: ActionType.Global,
  runtime: "main",
  name: "Change VR Info Panel Position",
  defaultAccelerators: ["Control+Alt+F11"]
},{
  id: GlobalActionId.switchOverlayScreenEditorInfoAnchor,
  type: ActionType.Global,
  runtime: "main",
  name: "Change Info Panel Position",
  defaultAccelerators: ["Control+Alt+F10"]
}, {
  id: GlobalActionId.switchOverlayFocusNext,
  type: ActionType.Global,
  runtime: "main",
  name: "Focus Next Overlay",
  defaultAccelerators: ["Control+Alt+F6"]
}, {
  id: GlobalActionId.switchOverlayFocusPrevious,
  type: ActionType.Global,
  runtime: "main",
  name: "Focus Previous Overlay",
  defaultAccelerators: ["Control+Alt+Shift+F6"]
}, {
  id: GlobalActionId.toggleOverlayPlacementProp,
  type: ActionType.Global,
  runtime: "main",
  name: "Change Target Property (X,Y,W,H)",
  defaultAccelerators: ["Control+Alt+F7"]
}, {
  id: GlobalActionId.incrementOverlayPlacementProp,
  type: ActionType.Global,
  runtime: "main",
  name: "Increment Target Property",
  defaultAccelerators: ["Control+Alt+F8"]
}, {
  id: GlobalActionId.decrementOverlayPlacementProp,
  type: ActionType.Global,
  runtime: "main",
  name: "Decrement Target Property",
  defaultAccelerators: ["Control+Alt+Shift+F8"]
}).map(options => [
  options.id,
  options
])) as Record<GlobalActionIdName, ActionDef>