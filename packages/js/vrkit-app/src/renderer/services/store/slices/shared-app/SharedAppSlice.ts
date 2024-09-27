import { getLogger } from "@3fv/logger-proxy"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { type ISharedAppState, newSharedAppState, type ThemeId } from "vrkit-app-common/models/app"
import { assign } from "vrkit-app-common/utils"

import { AppSettings, DashboardConfig, ThemeType } from "vrkit-models"
import { OverlayMode } from "vrkit-app-common/models/overlay-manager"
import { flow } from "lodash/fp"
import { isArray } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const
    selectAppSettings = (state: ISharedAppState) => state.appSettings,
    createAppSettingsSelector = <T>(selector: (appSettings: AppSettings) => T) =>
    flow(selectAppSettings, selector),
    selectActiveDashboardConfigId = createAppSettingsSelector(settings => settings.activeDashboardId)


const slice = createSlice({
  name: "shared",
  initialState: newSharedAppState(),
  reducers: {
    patch: (state: ISharedAppState, action: PayloadAction<Partial<ISharedAppState>>) => {
      return assign(state, action.payload ?? {})
    },

    setOverlayMode: (state: ISharedAppState, { payload: overlayMode }: PayloadAction<OverlayMode>) => {
      return {
        ...state,
        overlayMode
      }
    }
  },
  extraReducers: builder => builder,
  selectors: {
    selectOverlayMode: (state: ISharedAppState) => state.overlayMode ?? OverlayMode.NORMAL,
    selectAppSettings,
    selectDashboardConfigs: (state: ISharedAppState): DashboardConfig[] => state.overlayManager?.dashboardConfigs ?? [],
    selectActiveDashboardConfigId,
    selectActiveDashboardConfig: (state: ISharedAppState) => asOption(state.overlayManager.dashboardConfigs)
        .filter(isArray)
        .map((configs: DashboardConfig[]) => {
          const configId = selectActiveDashboardConfigId(state)
          return configs.find(it => it.id === configId)
        })
        .getOrNull(),
    selectThemeType: createAppSettingsSelector(settings => settings.themeType),
    selectThemeId:createAppSettingsSelector(settings => ThemeType[settings.themeType]  as ThemeId)
  }
})

/**
 * Reducer and generated actions
 */
export const { reducer: sharedAppReducer, actions: sharedAppActions, selectors: sharedAppSelectors } = slice

export default slice
