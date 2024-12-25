// import { THEMES } from "@vrkit-platform/shared"
// import { defaults } from "@vrkit-platform/shared"
import { AppSettings } from "@vrkit-platform/models"

export function loadWebAppSettings(): AppSettings {
  // const settings = window.loadAppSettingsSync()
  //const settings
  return AppSettings.create()
  //defaults(settings, {
    // customAccelerators: {},
    // theme: window.matchMedia("(prefers-color-scheme: dark)").matches ?
    //   THEMES.DARK :
    //   THEMES.LIGHT
  //})
}
