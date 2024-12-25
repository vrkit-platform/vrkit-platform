import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { OverlayWindowState } from "./OverlayWindowState"
import { OverlayWindowRole } from "@vrkit-platform/shared"
import React from "react"
import type { IPluginComponentProps } from "@vrkit-platform/plugin-sdk"

function isVROverlayWindow():boolean {
  return typeof window !== "undefined" ? window.location.hash?.includes("::VR") : false
}

const newOverlayWindowState = (): OverlayWindowState => ({
  windowRole: OverlayWindowRole.NONE,
  isVR: isVROverlayWindow(),
  OverlayComponent: null
})

const slice = createSlice({
  name: "overlayWindow",
  initialState: newOverlayWindowState(),
  reducers: {
    
    patch(state: OverlayWindowState, action: PayloadAction<Partial<OverlayWindowState>>): void {
      Object.assign(state, action.payload ?? {})
    },
    setWindowRole(state: OverlayWindowState, { payload: windowRole }: PayloadAction<OverlayWindowRole>) {
      state.windowRole = windowRole
      return state
    },
    setOverlayComponent(state: OverlayWindowState, { payload: OverlayComponent }: PayloadAction<React.ComponentType<IPluginComponentProps>>) {
      state.OverlayComponent = OverlayComponent
      return state
    }
  },
  selectors: {
    selectedIsVR: (state: OverlayWindowState) => state.isVR,
    selectWindowRole: (state: OverlayWindowState) => state.windowRole,
    selectOverlayComponent: (state: OverlayWindowState) => state.OverlayComponent
  }
})

export const { reducer: overlayWindowReducer, actions: overlayWindowActions, selectors: overlayWindowSelectors } = slice

export default slice
