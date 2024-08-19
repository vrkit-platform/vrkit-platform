import { THEMES } from "vrkit-app-common/models"
import { defaults } from "vrkit-app-common/utils"
import type { AppSettings } from "vrkit-app-common/models"
export function loadWebAppSettings(): AppSettings {
  // const settings = window.loadAppSettingsSync()
  const settings = {} as AppSettings
  return defaults(settings, {
    customAccelerators: {},
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches ?
      THEMES.DARK :
      THEMES.LIGHT
  })
}
