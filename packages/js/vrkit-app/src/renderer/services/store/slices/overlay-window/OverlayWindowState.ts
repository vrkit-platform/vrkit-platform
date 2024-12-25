import { OverlayWindowRole } from "@vrkit-platform/shared"
import React from "react"
import type { IPluginComponentProps } from "@vrkit-platform/plugin-sdk"

export interface OverlayWindowState {
  windowRole: OverlayWindowRole
  isVR: boolean
  OverlayComponent: React.ComponentType<IPluginComponentProps>
}
