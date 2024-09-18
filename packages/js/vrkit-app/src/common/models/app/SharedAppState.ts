import { OverlayMode } from "../overlay-manager"
import { ThemeType } from "vrkit-models"

export interface ISharedAppState {
  themeType: ThemeType
  zoomFactor: number
  activeDashboardId?: string
  overlayMode: OverlayMode
}

export function newSharedAppState(): ISharedAppState {
  return {
    themeType: ThemeType.AUTO,
    zoomFactor: 1.0,
    overlayMode: OverlayMode.NORMAL,
    activeDashboardId: null
  }
}