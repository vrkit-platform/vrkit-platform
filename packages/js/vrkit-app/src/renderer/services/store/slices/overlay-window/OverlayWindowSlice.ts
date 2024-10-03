import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { OverlayWindowState } from "./OverlayWindowState"
import { OverlayWindowRole } from "vrkit-app-common/models"

const newOverlayWindowState = (): OverlayWindowState => ({
  windowRole: OverlayWindowRole.NONE
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
    }
  },
  selectors: {
    selectWindowRole: (state: OverlayWindowState) => state.windowRole
  }
})

export const { reducer: overlayWindowReducer, actions: overlayWindowActions, selectors: overlayWindowSelectors } = slice

export default slice
