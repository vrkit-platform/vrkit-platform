import { EnvironmentKind } from "./Environment"
import { AppSettings, ThemeType } from "vrkit-models"

export interface AppConfig {
  env: EnvironmentKind
}


export const AppSettingsDefaults: AppSettings = {
  defaultDashboardConfigId: null,
  autoconnect: false,
  openDashboardOnLaunch: true,
  zoomFactor: 1.0,
  customAccelerators: {},
  overlayAnchors: {},
  themeType: ThemeType.DARK
}
