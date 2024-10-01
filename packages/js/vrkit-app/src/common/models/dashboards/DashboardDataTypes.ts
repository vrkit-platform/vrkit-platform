import { defaults } from "vrkit-app-common/utils"
import {
  DashboardConfig,
  OverlayConfig,
  SessionDataVariableValueMap,
  SessionTiming
} from "vrkit-models"
import type { SessionInfoMessage, PluginClientEventArgs, PluginClientEventType } from "vrkit-plugin-sdk" // ------ OverlayManager events & types

// ------ OverlayManager events & types

// import type { DashboardConfig } from "vrkit-models"

export interface DashboardsState {
  configs: DashboardConfig[]
  activeConfigId: string
}

export function newDashboardsState(state: Partial<DashboardsState> = {}): DashboardsState {
  return defaults({...state},{
    configs: [],
    activeConfigId: ""
  }) as DashboardsState
}


/**
 * Functions that can be invoked via IPC using `ipcRenderer.invoke`
 */
export enum DashboardManagerFnType {
  FETCH_DASHBOARD_CONFIGS = "FETCH_DASHBOARD_CONFIGS",
  UPDATE_DASHBOARD_CONFIG = "UPDATE_DASHBOARD_CONFIG",
  CREATE_DASHBOARD_CONFIG = "CREATE_DASHBOARD_CONFIG",
  DELETE_DASHBOARD_CONFIG = "DELETE_DASHBOARD_CONFIG",
  OPEN_DASHBOARD = "OPEN_DASHBOARD",
  CLOSE_DASHBOARD = "CLOSE_DASHBOARD",
  LAUNCH_DASHBOARD_LAYOUT_EDITOR = "LAUNCH_DASHBOARD_LAYOUT_EDITOR",
  
}

/**
 * Represents a string literal type derived from concatenating
 * "DASHBOARD_MANAGER_FN_" with the value of an DashboardManagerFnType.
 *
 * This type is primarily used to ensure that IPC (Inter-Process Communication)
 * names for overlay client functions follow a specific naming convention.
 */
export type DashboardManagerFnIPCName = `DASHBOARD_MANAGER_FN_${DashboardManagerFnType}`

/**
 * Converts a given DashboardManager function type to its corresponding IPC name.
 *
 * @param {DashboardManagerFnType} type - The type of the DashboardManager function
 *     to be converted.
 * @return {DashboardManagerFnIPCName} The corresponding IPC name for the
 *     specified DashboardManager function type.
 */
export function DashboardManagerFnTypeToIPCName(type: DashboardManagerFnType): DashboardManagerFnIPCName {
  return `DASHBOARD_MANAGER_FN_${type.toUpperCase()}` as DashboardManagerFnIPCName
}

