import type { BrowserWindowConstructorOptions } from "electron"
import iconPng from "!!url-loader!assets/icons/icon.png"
import { isDev } from "vrkit-app-common/utils"

export function windowOptionDefaults(): BrowserWindowConstructorOptions {
  return {
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    fullscreenable: false,
    icon: iconPng,
    resizable: true,
    webPreferences: {
      allowRunningInsecureContent: true,
      webSecurity: false,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      sandbox: false,
      devTools: isDev
    }
  }
}
