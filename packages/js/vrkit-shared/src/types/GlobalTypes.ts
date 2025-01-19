import type { WindowConfig } from "../services/window-manager"

declare global {
  let isDev: boolean
  let VRKitWindowConfig: WindowConfig
}

export {}