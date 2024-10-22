import { newOverlaysState, OverlaysState } from "../overlays"
import { AppSettings, ThemeType } from "vrkit-models"
import { DevSettings, newDevSettings } from "./DevSettings"
import { DashboardsState, newDashboardsState } from "../dashboards"
import { newSessionsState, SessionsState } from "../sessions"
import { ActionsState, newActionsState } from "../actions"

export interface ISharedAppState {
  // themeType: ThemeType
  // zoomFactor: number
  // activeDashboardId?: string
  appSettings: AppSettings
  devSettings: DevSettings
  dashboards: DashboardsState
  sessions: SessionsState
  overlays: OverlaysState
  actions: ActionsState
}

export function newSharedAppState(): ISharedAppState {
  return {
    // themeType: ThemeType.AUTO,
    // zoomFactor: 1.0,
    // activeDashboardId: null
    devSettings: newDevSettings(),
    appSettings: AppSettings.create(),
    
    actions: newActionsState(),
    dashboards: newDashboardsState(),
    sessions: newSessionsState(),
    overlays: newOverlaysState(),
    
    
  }
}