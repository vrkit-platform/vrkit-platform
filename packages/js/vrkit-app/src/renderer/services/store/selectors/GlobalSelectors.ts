import type { AppRootState } from "../AppRootState"
import { createSelector,Selector } from "@reduxjs/toolkit"
import { get } from "lodash/fp"
import type { GlobalState } from "../slices/global/GlobalState"
import { flow } from "lodash"


const selectGlobal = ((state: AppRootState) => state.global) as Selector<AppRootState, GlobalState>

const createGlobalSelector = <T>(sel: (state: GlobalState) => T) => (createSelector(selectGlobal,sel) as Selector<AppRootState, T>)

export const selectSettings = createGlobalSelector(get("settings"))
export const selectThemeId = createGlobalSelector(flow(get("settings"),get("theme")))
export const selectDialogState = createGlobalSelector(get("dialog"))

export const selectReady = createGlobalSelector(get("ready"))

export interface AuthContextState {
  isInitialized: boolean
}
