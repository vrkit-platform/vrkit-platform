import { AppActionId, AppActionIds } from "./AppActionIds"
import { ActionOptions } from "./ActionTypes"

export const ElectronMainAppActions = Object.fromEntries(
  [
    {
      id: AppActionIds.resetAll,
      runtime: "main",
      name: "Reset Application"
    },
    {
      id: AppActionIds.gotoAppSettings,
      runtime: "main",
      name: "Preferences",
      defaultAccelerators: ["CommandOrControl+,"]
    },
    {
      id: AppActionIds.closeWindow,
      runtime: "main",
      name: "Close Window",
      defaultAccelerators: ["CommandOrControl+w"]
    },
    {
      id: AppActionIds.quit,
      runtime: "main",
      name: "Quit",
      defaultAccelerators: ["CommandOrControl+q"]
    },
    {
      id: AppActionIds.zoomDefault,
      runtime: "main",
      name: "Actual Size",
      defaultAccelerators: ["CommandOrControl+0"]
    },
    {
      id: AppActionIds.zoomIn,
      runtime: "main",
      name: "Zoom In",
      defaultAccelerators: ["CommandOrControl+="]
    },
    {
      id: AppActionIds.zoomOut,
      runtime: "main",
      name: "Zoom Out",
      defaultAccelerators: ["CommandOrControl+-"]
    }
  ].map(options => [options.id, options])
) as { [id in AppActionId]: ActionOptions }
