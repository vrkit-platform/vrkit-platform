import type { DashboardConfig } from "vrkit-models"
import type { OverlayWindow } from "./OverlayWindow"

export interface OverlayManagerState {
  configs: DashboardConfig[]
  
  activeSessionId: string
  
  overlays: OverlayWindow[]
}
export type OverlayManagerStatePatchFn = (state: OverlayManagerState) => Partial<OverlayManagerState>
