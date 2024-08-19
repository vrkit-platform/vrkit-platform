export enum DesktopWindowStatus {
  normal = "normal",
  maximized = "maximized",
  minimized = "minimized",
  fullscreen = "fullscreen"
}

export type DesktopWindowStatusKind =  DesktopWindowStatus | `${DesktopWindowStatus}`
