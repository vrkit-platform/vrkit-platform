import type { EnvironmentKind } from "./Environment"
import { type AppSettings, ThemeType } from "@vrkit-platform/models"

export type AppSettingsKey = keyof AppSettings

export type AppSettingKeyType<K extends AppSettingsKey, T> = AppSettings[K] extends T ? K : never

export type AppSettingBoolKey<K extends AppSettingsKey> = AppSettingKeyType<K,boolean>


export interface AppConfig {
  env: EnvironmentKind
}

export const AppSettingsDefaults: AppSettings = {
  defaultDashboardConfigId: null,
  autoconnect: false,
  openAppOnBoot: false,
  openDashboardOnLaunch: true,
  zoomFactor: 1.0,
  actionCustomizations: {},
  overlayAnchors: {},
  themeType: ThemeType.DARK
}
