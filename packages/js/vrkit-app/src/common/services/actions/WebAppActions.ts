import { AppActionId } from "./AppActionIds"
import type { ActionOptions } from "./ActionTypes"

export const WebAppActions = {
  importProject: {
    id: AppActionId.importProject,
    runtime: "web",
    name: "Import Project",
    defaultAccelerators: ["Control+Shift+i"]
  } as ActionOptions,
  newProject: {
    id: AppActionId.newProject,
    runtime: "web",
    name: "Create Project",
    defaultAccelerators: ["Control+Shift+n"]
  } as ActionOptions,
}


