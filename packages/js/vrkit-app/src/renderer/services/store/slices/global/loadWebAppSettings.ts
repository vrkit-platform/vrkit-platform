// import { THEMES } from "vrkit-app-common/models"
// import { defaults } from "vrkit-app-common/utils"
import { AppSettings } from "vrkit-models"

export function loadWebAppSettings(): AppSettings {
  // const settings = window.loadAppSettingsSync()
  //const settings =
  return AppSettings.create()
  //defaults(settings, {
    // customAccelerators: {},
    // theme: window.matchMedia("(prefers-color-scheme: dark)").matches ?
    //   THEMES.DARK :
    //   THEMES.LIGHT
  //})
}
