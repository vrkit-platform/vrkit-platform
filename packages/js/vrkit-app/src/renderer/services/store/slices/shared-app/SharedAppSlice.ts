import { getLogger } from "@3fv/logger-proxy"
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit"
import {
  ActionDef,
  ActionsState,
  assign,
  DashboardsState,
  Identity,
  type ISharedAppState,
  ISharedAppStateLeaf,
  isNotEmpty,
  OverlayEditorGlobalActionIds,
  OverlayVREditorPropertyName,
  Pair,
  pairOf,
  PluginsState,
  propEqualTo,
  SessionDetail,
  SessionsState,
  type ThemeId,
  valuesOf
} from "@vrkit-platform/shared"

import {
  AppSettings,
  DashboardConfig,
  OverlayInfo,
  PluginComponentDefinition,
  PluginComponentType,
  PluginInstall,
  PluginManifest,
  ThemeType
} from "@vrkit-platform/models"
import { flow } from "lodash/fp"
import { isArray, isDefined } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import { uniqBy } from "lodash"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export type PluginCompEntry = Pair<PluginManifest, PluginComponentDefinition>

const selectAppSettings = (state: ISharedAppState): AppSettings => state.appSettings,
  selectDesktopWindowMap = (state: ISharedAppState) => state.desktopWindows.windows,
  selectDesktopWindows = createSelector(selectDesktopWindowMap, valuesOf),
  selectModalDesktopWindows = createSelector(selectDesktopWindows, windows =>
    windows.filter(propEqualTo("modal", true))
  ),
  hasActiveModalDesktopWindow = createSelector(selectModalDesktopWindows, windows => windows.length > 0),
  selectSessionsState = (state: ISharedAppState) => state.sessions,
  selectDashboardsState = (state: ISharedAppState) => state.dashboards,
  selectPluginState = (state: ISharedAppState): PluginsState => state.plugins,
  selectAvailablePluginMap = createSelector(
    selectPluginState,
    (pluginsState): Record<string, PluginManifest> => pluginsState.availablePlugins ?? {}
  ),
  selectAvailablePlugins = createSelector(
    selectAvailablePluginMap,
    pluginsMap => Object.values(pluginsMap).filter(isDefined) as PluginManifest[]
  ),
  selectInstalledPluginMap = createSelector(
    selectPluginState,
    (pluginsState): Record<string, PluginInstall> => pluginsState.plugins ?? {}
  ),
  selectInstalledPlugins = createSelector(
    selectInstalledPluginMap,
    pluginsMap =>
      Object.values(pluginsMap)
        .map(install => install.manifest)
        .filter(isDefined) as PluginManifest[]
  ),
  selectInstalledPluginManifestMap = createSelector(selectInstalledPlugins, plugins =>
    plugins.reduce((map, plugin) => ({ ...map, [plugin.id]: plugin }), {} as Record<string, PluginManifest>)
  ), // ALL PLUGIN PROVIDED COMPONENTS
  selectPluginComponentDefs = createSelector(selectInstalledPlugins, (manifests): PluginCompEntry[] => {
    const allComponents = manifests
      .flatMap(
        manifest =>
          (manifest?.components?.map?.(c => pairOf(manifest, c)) ?? []) as Array<
            Pair<PluginManifest, PluginComponentDefinition>
          >
      )
      .filter(isDefined)
    return uniqBy(allComponents, ([, c]) => c.id)
  }), // ALL PLUGIN PROVIDED `PluginComponentType.OVERLAY` COMPONENTS
  selectPluginComponentOverlayDefs = createSelector(
    selectPluginComponentDefs,
    (defs: PluginCompEntry[]): PluginCompEntry[] => defs.filter(([, c]) => c.type === PluginComponentType.OVERLAY)
  ),
  selectPluginComponentOverlayDefsMap = createSelector(
    selectPluginComponentOverlayDefs,
    (defs: PluginCompEntry[]): Record<string, PluginCompEntry> =>
      defs.reduce(
        (map, entry) => ({
          ...map,
          [entry[1].id]: entry
        }),
        {} as Record<string, PluginCompEntry>
      )
  ),
  createAppSettingsSelector = <T>(selector: (appSettings: AppSettings) => T) => flow(selectAppSettings, selector),
  createDashboardsSelector = <T>(selector: (dashboards: DashboardsState) => T) => flow(selectDashboardsState, selector),
  selectDefaultDashboardConfigId = createAppSettingsSelector(settings => settings.defaultDashboardConfigId),
  selectActiveDashboardConfigId = createDashboardsSelector(dashboards => dashboards.activeConfigId),
  createSessionsSelector = <T>(selector: (state: SessionsState) => T) => flow(selectSessionsState, selector),
  createActiveDashboardConfigSelector =
    <T>(
      selector: (state: ISharedAppState, activeDashboardConfig: DashboardConfig) => T
    ): ((state: ISharedAppState) => T) =>
    (state: ISharedAppState) =>
      selector(
        state,
        asOption(state.dashboards.configs)
          .filter(isArray)
          .map((configs: DashboardConfig[]) => {
            const configId = state.dashboards.activeConfigId
            return configs.find(it => it.id === configId)
          })
          .getOrNull()
      ),
  selectActionsState = (state: ISharedAppState) => state.actions,
  selectAllActionMap = (state: ISharedAppState) => state.actions?.actions ?? {},
  createActionsSelector = <T>(selector: (state: ActionsState) => T) => createSelector(selectActionsState, selector)

function createActiveSessionSelector<T>(selector: (session: SessionDetail) => T) {
  return createSessionsSelector((state: SessionsState) =>
    selector(
      state?.activeSessionType === "LIVE"
        ? state.liveSession
        : state?.activeSessionType === "DISK"
          ? state.diskSession
          : null
    )
  )
}

const slice = createSlice({
  name: "shared",
  initialState: () => ({}) as ISharedAppState,
  reducers: {
    patchLeaf: (state: ISharedAppState, action: PayloadAction<[ISharedAppStateLeaf, Partial<ISharedAppState>]>) => {
      const [leaf, patch] = action.payload
      return Object.assign(state, { [leaf]: patch })
    },
    patch: (state: ISharedAppState, action: PayloadAction<Partial<ISharedAppState>>) => {
      return assign(state, action.payload ?? {})
    }
  },
  extraReducers: builder => builder,
  selectors: {
    selectDesktopWindowMap,
    selectDesktopWindows,
    selectModalDesktopWindows,
    hasActiveModalDesktopWindow,
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
    selectAllActionMap,
    selectAllActions: createSelector(selectAllActionMap, valuesOf),
    selectOverlayEditorActions: createActionsSelector(({ actions }) =>
      OverlayEditorGlobalActionIds.map(id => actions[id]).filter(isDefined<ActionDef>)
    ),

    selectAppSettings,
    selectActionCustomizations: createSelector(selectAppSettings, settings => settings.actionCustomizations ?? {}),
    selectDefaultDashboardConfigId,

    selectPluginState,
    selectAvailablePluginMap,
    selectAvailablePlugins,

    selectInstalledPlugins,
    selectInstalledPluginManifestMap,
    selectInstalledPluginMap,
    selectPluginComponentDefs,
    selectPluginComponentOverlayDefs,
    selectPluginComponentOverlayDefsMap,

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
    // selectActiveSessionTimeAndDuration: createActiveSessionSelector(session => session?.timeAndDuration),
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
    // selectLiveSessionTimeAndDuration: createSessionsSelector(
    //   (state: SessionsState) => state.liveSession?.timeAndDuration
    // ),
    selectLiveSessionInfo: createSessionsSelector((state: SessionsState) => state.liveSession?.info),
    selectLiveSessionWeekendInfo: createSessionsSelector((state: SessionsState) => state.liveSession?.info?.weekendInfo)
  }
})

/**
 * Reducer and generated actions
 */
export const { reducer: sharedAppReducer, actions: sharedAppActions, selectors: sharedAppSelectors } = slice

export default slice
