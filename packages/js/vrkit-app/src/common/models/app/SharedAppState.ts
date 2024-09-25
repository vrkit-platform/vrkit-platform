import { newOverlayManagerState, OverlayManagerState, OverlayMode } from "../overlay-manager"
import { AppSettings, ThemeType } from "vrkit-models"
import { DevSettings, newDevSettings } from "./DevSettings"

export interface ISharedAppState {
  // themeType: ThemeType
  // zoomFactor: number
  // activeDashboardId?: string
  appSettings: AppSettings
  devSettings: DevSettings
  overlayManager: OverlayManagerState
  overlayMode: OverlayMode
  
}

export function newSharedAppState(): ISharedAppState {
  return {
    // themeType: ThemeType.AUTO,
    // zoomFactor: 1.0,
    // activeDashboardId: null
    devSettings: newDevSettings(),
    appSettings: AppSettings.create(),
    overlayManager: newOverlayManagerState(),
    overlayMode: OverlayMode.NORMAL,
    
  }
}