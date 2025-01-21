import type { OverlaysState } from "../overlays"
import type { AppSettings } from "@vrkit-platform/models"
import type { DevSettings } from "./DevSettings"
import type { DashboardsState } from "../dashboards"
import type { SessionsState } from "../sessions"
import type { ActionsState } from "../actions"
import type { PluginsState } from "../plugins"
import type { DesktopWindowsState } from "../desktop-windows"

export interface ISharedAppState {
  appSettings: AppSettings
  devSettings: DevSettings
  dashboards: DashboardsState
  sessions: SessionsState
  overlays: OverlaysState
  actions: ActionsState
  plugins: PluginsState
  desktopWindows: DesktopWindowsState
}
