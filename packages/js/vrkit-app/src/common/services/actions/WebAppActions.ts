import { AppActionIds } from "./AppActionIds"
import type { ActionOptions } from "./ActionTypes"

export const WebAppActions = {
  importProject: {
    id: AppActionIds.importProject,
    runtime: "web",
    name: "Import Project",
    defaultAccelerators: ["Control+Shift+i"]
  } as ActionOptions,
  newProject: {
    id: AppActionIds.newProject,
    runtime: "web",
    name: "Create Project",
    defaultAccelerators: ["Control+Shift+n"]
  } as ActionOptions,
}


