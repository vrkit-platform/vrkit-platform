import { OverlayWindowRole } from "vrkit-app-common/models"
import React from "react"
import type { PluginClientComponentProps } from "vrkit-plugin-sdk"

export interface OverlayWindowState {
  windowRole: OverlayWindowRole
  OverlayComponent: React.ComponentType<PluginClientComponentProps>
}
