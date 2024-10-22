import { OverlayWindowRole } from "vrkit-shared"
import React from "react"
import type { IPluginClientComponentProps } from "vrkit-plugin-sdk"

export interface OverlayWindowState {
  windowRole: OverlayWindowRole
  isVR: boolean
  OverlayComponent: React.ComponentType<IPluginClientComponentProps>
}
