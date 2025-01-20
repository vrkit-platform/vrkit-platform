import { EnvironmentKind } from "./Environment"
import { AppSettings, ThemeType } from "@vrkit-platform/models"

export interface AppConfig {
  env: EnvironmentKind
}

export const AppSettingsDefaults: AppSettings = {
  defaultDashboardConfigId: null,
  autoconnect: false,
  openAppOnBoot: false,
  openDashboardOnLaunch: true,
  zoomFactor: 1.0,
  customAccelerators: {},
  overlayAnchors: {},
  themeType: ThemeType.DARK
}
