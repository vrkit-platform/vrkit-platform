import { getLogger } from "@3fv/logger-proxy"
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { type ISharedAppState, newSharedAppState, type ThemeId } from "vrkit-shared"
import { assign, Identity, isNotEmpty } from "vrkit-shared"

import {
  AppSettings,
  DashboardConfig, OverlayInfo,
  ThemeType
} from "vrkit-models"
import { flow } from "lodash/fp"
import { isArray, isDefined } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import type {
  SessionDetail,
  SessionsState
} from "vrkit-shared"
import type {
  DashboardsState, OverlayVREditorPropertyName
} from "vrkit-shared"
import {
  ActionDef,
  OverlayEditorGlobalActionIds
} from "vrkit-shared"
import { ActionsState } from "vrkit-shared"

const log = getLogger(__filename)
const { info, debug, warn, error } = log




const
    selectAppSettings = (state: ISharedAppState) => state.appSettings,
    selectSessionsState = (state: ISharedAppState) => state.sessions,
    selectDashboardsState = (state: ISharedAppState) => state.dashboards,
    createAppSettingsSelector = <T>(selector: (appSettings: AppSettings) => T) =>
      flow(selectAppSettings, selector),
    
    createDashboardsSelector = <T>(selector: (dashboards: DashboardsState) => T) =>
        flow(selectDashboardsState, selector),
    
    selectDefaultDashboardConfigId = createAppSettingsSelector(settings => settings.defaultDashboardConfigId),
    
    
    selectActiveDashboardConfigId = createDashboardsSelector(dashboards => dashboards.activeConfigId),
    
    createSessionsSelector = <T>(selector: (state: SessionsState) => T) =>
        flow(selectSessionsState, selector),
    
    createActiveDashboardConfigSelector = <T>(selector: (state: ISharedAppState, activeDashboardConfig: DashboardConfig) => T):((state: ISharedAppState) => T) => {
      return (state: ISharedAppState) => {
        const activeDashboardConfig = asOption(state.dashboards.configs)
            .filter(isArray)
            .map((configs:DashboardConfig[]) => {
              const configId = state.dashboards.activeConfigId
              return configs.find(it => it.id === configId)
            })
            .getOrNull()
        
        return selector(state, activeDashboardConfig)
      }
    },
    
    selectActionsState = (state: ISharedAppState) => state.actions,
    createActionsSelector = <T>(selector: (state: ActionsState) => T) =>
        createSelector(selectActionsState,selector)
        // flow(selectActionsState, selector)

function createActiveSessionSelector<T>(selector: (session: SessionDetail) => T) {
  return createSessionsSelector((state: SessionsState) =>
      selector(
          state.activeSessionType === "LIVE"
              ? state.liveSession
              : state.activeSessionType === "DISK"
                  ? state.diskSession
                  : null
      ))
}

const slice = createSlice({
  name: "shared",
  initialState: newSharedAppState(),
  reducers: {
    patch: (state: ISharedAppState, action: PayloadAction<Partial<ISharedAppState>>) => {
      return assign(state, action.payload ?? {})
    }

    // setOverlayMode: (state: ISharedAppState, { payload: overlayMode }: PayloadAction<OverlayMode>) => {
    //   return {
    //     ...state,
    //     overlayMode
    //   }
    // }
  },
  extraReducers: builder => builder,
  selectors: {
    selectEditorEnabled: (state: ISharedAppState) => state.overlays.editor.enabled,
    selectEditorSelectedOverlayConfigId: (state: ISharedAppState) => state.overlays.editor.selectedOverlayConfigId,
    selectEditorSelectedOverlayConfigProp: (state: ISharedAppState) =>
      state.overlays.editor.selectedOverlayConfigProp as OverlayVREditorPropertyName,
    
    selectEditorSelectedOverlayConfig: createActiveDashboardConfigSelector(
      (state: ISharedAppState, dashConfig: DashboardConfig) =>
        (dashConfig?.overlays ?? Array<OverlayInfo>()).find(
          it => it.id === state.overlays.editor.selectedOverlayConfigId
        )
    ),
    selectOverlayEditorActions: createActionsSelector(({ actions }) =>
      OverlayEditorGlobalActionIds.map(id => actions[id]).filter(isDefined<ActionDef>)
    ),
    
    selectAppSettings,
    selectDefaultDashboardConfigId,

    selectDashboardConfigs: (state: ISharedAppState): DashboardConfig[] => state.dashboards.configs ?? [],
    selectActiveDashboardConfigId,

    selectActiveDashboardConfig: (state: ISharedAppState): DashboardConfig =>
      asOption(state.dashboards.configs)
        .filter(isArray)
        .map((configs: DashboardConfig[]) => {
          const configId = state.dashboards.activeConfigId
          return configs.find(it => it.id === configId)
        })
        .getOrNull(),
    selectThemeType: createAppSettingsSelector(settings => settings.themeType),
    selectThemeId: createAppSettingsSelector(settings => ThemeType[settings.themeType] as ThemeId),

    //   SESSION SELECTORS

    hasAvailableSession: createSessionsSelector((state: SessionsState) =>
      [state.diskSession?.isAvailable, state.liveSession?.isAvailable].some(it => it === true)
    ),

    hasActiveSession: createSessionsSelector(
      (state: SessionsState) => isNotEmpty(state.activeSessionType) && state.activeSessionType !== "NONE"
    ),

    isLiveSessionAvailable: createSessionsSelector((state: SessionsState) => state.liveSession?.isAvailable === true),

    // Active Session Selectors
    selectActiveSessionType: createSessionsSelector((state: SessionsState) => state.activeSessionType),
    selectActiveSession: createActiveSessionSelector(Identity),
    selectActiveSessionData: createActiveSessionSelector(session => session?.data),
    selectActiveSessionId: createActiveSessionSelector(session => session?.id),
    selectActiveSessionTiming: createActiveSessionSelector(session => session?.timing),
    selectActiveSessionInfo: createActiveSessionSelector(session => session?.info),
    selectActiveSessionWeekendInfo: createActiveSessionSelector(session => session?.info?.weekendInfo),

    // Disk Session Selectors
    selectDiskSession: createSessionsSelector((state: SessionsState) => state.diskSession),

    // Live Session Selectors
    selectLiveSession: createSessionsSelector((state: SessionsState) =>
      isNotEmpty(state.liveSession?.id) ? state.liveSession : null
    ),
    selectLiveSessionData: createSessionsSelector((state: SessionsState) => state.liveSession?.data),
    selectLiveSessionId: createSessionsSelector((state: SessionsState) => state.liveSession?.id),
    selectLiveSessionTiming: createSessionsSelector((state: SessionsState) => state.liveSession?.timing),
    selectLiveSessionInfo: createSessionsSelector((state: SessionsState) => state.liveSession?.info),
    selectLiveSessionWeekendInfo: createSessionsSelector((state: SessionsState) => state.liveSession?.info?.weekendInfo)
  }
})

/**
 * Reducer and generated actions
 */
export const { reducer: sharedAppReducer, actions: sharedAppActions, selectors: sharedAppSelectors } = slice

export default slice
