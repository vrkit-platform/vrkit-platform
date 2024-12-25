import { ActionDef, ActionType, AppActionId, AppActionIdName } from "@vrkit-platform/shared"

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
