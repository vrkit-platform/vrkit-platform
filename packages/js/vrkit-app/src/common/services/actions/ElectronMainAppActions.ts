import { AppActionIdName, AppActionId } from "./AppActionIds"
import { ActionDef, ActionType } from "./ActionTypes"
import { GlobalActionId, GlobalActionIdName } from "./GlobalActionIds"

export const ElectronMainAppActions = Object.fromEntries(
  Array<ActionDef>(
    {
      id: AppActionId.resetAll,
      type: ActionType.App,
      runtime: "main",
      name: "Reset Application"
    },
    {
      id: AppActionId.gotoAppSettings,
      type: ActionType.App,
      runtime: "main",
      name: "Preferences",
      defaultAccelerators: ["CommandOrControl+,"]
    },
    {
      id: AppActionId.closeWindow,
      type: ActionType.App,
      runtime: "main",
      name: "Close Window",
      defaultAccelerators: ["CommandOrControl+w"]
    },
    {
      id: AppActionId.quit,
      type: ActionType.App,
      runtime: "main",
      name: "Quit",
      defaultAccelerators: ["CommandOrControl+q"]
    },
    {
      id: AppActionId.zoomDefault,
      type: ActionType.App,
      runtime: "main",
      name: "Actual Size",
      defaultAccelerators: ["CommandOrControl+0"]
    },
    {
      id: AppActionId.zoomIn,
      type: ActionType.App,
      runtime: "main",
      name: "Zoom In",
      defaultAccelerators: ["CommandOrControl+="]
    },
    {
      id: AppActionId.zoomOut,
      type: ActionType.App,
      runtime: "main",
      name: "Zoom Out",
      defaultAccelerators: ["CommandOrControl+-"]
    }
  ).map(options => [options.id, options])
) as Record<AppActionIdName, ActionDef>


export const ElectronMainGlobalActions = Object.fromEntries(
    Array<ActionDef>(
        {
          id: GlobalActionId.toggleOverlayEditor,
          type: ActionType.Global,
          runtime: "main",
          name: "Toggle Overlay Edit Mode"
        },
        {
          id: GlobalActionId.switchOverlayFocusNext,
          type: ActionType.Global,
          runtime: "main",
          name: "Focus Next Overlay",
          defaultAccelerators: ["Control+Alt+F6"]
        },
        {
          id: GlobalActionId.switchOverlayFocusPrevious,
          type: ActionType.Global,
          runtime: "main",
          name: "Focus Previous Overlay",
          defaultAccelerators: ["Control+Alt+Shift+F6"]
        },
        {
          id: GlobalActionId.toggleOverlayPlacementProp,
          type: ActionType.Global,
          runtime: "main",
          name: "Change Target Property (X,Y,W,H)",
          defaultAccelerators: ["Control+Alt+F7"]
        },
        {
          id: GlobalActionId.incrementOverlayPlacementProp,
          type: ActionType.Global,
          runtime: "main",
          name: "Increment Target Property",
          defaultAccelerators: ["Control+Alt+F8"]
        },
        {
          id: GlobalActionId.decrementOverlayPlacementProp,
          type: ActionType.Global,
          runtime: "main",
          name: "Decrement Target Property",
          defaultAccelerators: ["Control+Alt+Shift+F8"]
        }
    ).map(options => [options.id, options])
) as Record<GlobalActionIdName, ActionDef>
