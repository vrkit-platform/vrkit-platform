import { newDevSettings } from "./newDevSettings"
import { AppSettings } from "@vrkit-platform/models"
import { newActionsState } from "../actions"
import { newDashboardsState } from "../dashboards"
import { newSessionsState } from "../sessions"
import { newOverlaysState } from "../overlays"
import { newPluginsState } from "../plugins"
import type { ISharedAppState } from "./SharedAppState"
import { newDesktopWindowsState } from "../desktop-windows"

export function newSharedAppState():ISharedAppState {
  return {
    devSettings: newDevSettings(),
    appSettings: AppSettings.create(),
    desktopWindows: newDesktopWindowsState(),
    actions: newActionsState(),
    dashboards: newDashboardsState(),
    sessions: newSessionsState(),
    overlays: newOverlaysState(),
    plugins: newPluginsState()
  }
}