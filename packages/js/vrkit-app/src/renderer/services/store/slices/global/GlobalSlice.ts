import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { GlobalState } from "./GlobalState"
import type { AppDialogStateValue } from "./AppDialogStateValue"
import { loadWebAppSettings } from "./loadWebAppSettings"
import type {ThemeId} from "@vrkit-platform/shared"

const newGlobalState = (): GlobalState => ({
  // settings: loadWebAppSettings(),
  ready: true,
  dialog: null
})



const slice = createSlice({
  name: "global",
  initialState: newGlobalState(),
  reducers: {
    // setTheme(
    //   state: GlobalState,
    //   {payload: theme}: PayloadAction<ThemeId>
    // ): void {
    //   state.settings.theme = theme ?? "DARK"
    // },
    patch(
      state: GlobalState,
      action: PayloadAction<Partial<GlobalState>>
    ): void {
      Object.assign(state, action.payload ?? {})
    },
    openDialog(state: GlobalState, {payload: dialog}: PayloadAction<AppDialogStateValue>) {
      state.dialog = dialog
      return state
    },
    closeModal(state: GlobalState, _void: PayloadAction) {
      state.dialog = null
      return state
    }
  },
  
})

export const { reducer:globalReducer, actions:globalActions } = slice

export default slice
