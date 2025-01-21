import type { WindowConfig } from "../models/desktop-windows"

declare global {
  let isDev: boolean
  let VRKitWindowConfig: WindowConfig
}

export {}