export enum DesktopWindowStatus {
  normal = "normal",
  maximized = "maximized",
  minimized = "minimized",
  fullscreen = "fullscreen"
}

export type DesktopWindowStatusKind =  DesktopWindowStatus | `${DesktopWindowStatus}`

export enum DesktopWindowTrafficLight {
  maximize = "maximize",
  minimize = "minimize",
  close = "close"
}