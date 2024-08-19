export const AppActionIds = {
  gotoAppSettings: "gotoAppSettings",
  resetAll: "resetAll",
  quit: "quit",
  //newWindow: "newWindow",
  closeWindow: "closeWindow",
  
  save: "save",
  
  zoomDefault: "zoomDefault",
  zoomIn: "zoomIn",
  zoomOut: "zoomOut",
  importProject: "importProject",
  newProject: "newProject"
}
export type AppActionId = keyof typeof AppActionIds