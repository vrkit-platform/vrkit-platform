import { newOverlaysState, OverlaysState } from "../overlays"
import { AppSettings, ThemeType } from "vrkit-models"
import { DevSettings, newDevSettings } from "./DevSettings"
import { DashboardsState, newDashboardsState } from "../dashboards"
import { newSessionsState, SessionsState } from "../sessions"
import { ActionsState, newActionsState } from "../actions"
import { newPluginsState, PluginsState } from "../plugins"

export interface ISharedAppState {
  appSettings: AppSettings
  devSettings: DevSettings
  dashboards: DashboardsState
  sessions: SessionsState
  overlays: OverlaysState
  actions: ActionsState
  plugins: PluginsState
}

export function newSharedAppState(): ISharedAppState {
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