import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { OverlayWindowState } from "./OverlayWindowState"
import { OverlayWindowRole } from "vrkit-app-common/models"
import React from "react"
import type { PluginClientComponentProps } from "vrkit-plugin-sdk"

const newOverlayWindowState = (): OverlayWindowState => ({
  windowRole: OverlayWindowRole.NONE,
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
    setOverlayComponent(state: OverlayWindowState, { payload: OverlayComponent }: PayloadAction<React.ComponentType<PluginClientComponentProps>>) {
      state.OverlayComponent = OverlayComponent
      return state
    }
  },
  selectors: {
    selectWindowRole: (state: OverlayWindowState) => state.windowRole,
    selectOverlayComponent: (state: OverlayWindowState) => state.OverlayComponent
  }
})

export const { reducer: overlayWindowReducer, actions: overlayWindowActions, selectors: overlayWindowSelectors } = slice

export default slice
