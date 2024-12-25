import { newDevSettings } from "./newDevSettings"
import { AppSettings } from "@vrkit-platform/models"
import { newActionsState } from "../actions"
import { newDashboardsState } from "../dashboards"
import { newSessionsState } from "../sessions"
import { newOverlaysState } from "../overlays"
import { newPluginsState } from "../plugins"
import { ISharedAppState } from "./SharedAppState"

export function newSharedAppState():ISharedAppState {
  return {
    devSettings: newDevSettings(),
    appSettings: AppSettings.create(),
    
    actions: newActionsState(),
    dashboards: newDashboardsState(),
    sessions: newSessionsState(),
    overlays: newOverlaysState(),
    plugins: newPluginsState()
  }
}