import type { WindowConfig } from "../services/window-manager"

declare global {
  let isDev: boolean
  
  interface Window {
    VRKWindowConfig: WindowConfig
  }
}

export {}