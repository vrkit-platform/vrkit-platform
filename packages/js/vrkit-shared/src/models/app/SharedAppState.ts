import { OverlaysState } from "../overlays"
import { AppSettings } from "vrkit-models"
import { DevSettings } from "./DevSettings"
import { DashboardsState } from "../dashboards"
import { SessionsState } from "../sessions"
import { ActionsState } from "../actions"
import { PluginsState } from "../plugins"

export interface ISharedAppState {
  appSettings: AppSettings
  devSettings: DevSettings
  dashboards: DashboardsState
  sessions: SessionsState
  overlays: OverlaysState
  actions: ActionsState
  plugins: PluginsState
}
