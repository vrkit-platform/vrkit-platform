import {
  DashboardConfig,
  OverlayInfo,
  OverlayPlacement,
  SessionDataVariableValueMap,
  SessionTiming
} from "vrkit-models"
import type { SessionInfoMessage, PluginClientEventArgs, PluginClientEventType } from "vrkit-plugin-sdk" // ------ OverlayManager events & types

// ------ OverlayManager events & types

/**
 * Overlay manager event types `manager -> manager`
 */
export enum OverlayManagerEventType {
  STATE_CHANGED = "STATE_CHANGED"
}

/**
 * OverlayManagerEventType -> ipc channel name conversion
 */
export type OverlayManagerEventIPCName = `OVERLAY_MANAGER_EVENT_${OverlayManagerEventType}`

/**
 * OverlayManagerEventTypeToIPCName
 *
 * @param type
 * @constructor
 */
export function OverlayManagerEventTypeToIPCName(type: OverlayManagerEventType): OverlayManagerEventIPCName {
  return `OVERLAY_MANAGER_EVENT_${type.toUpperCase()}` as OverlayManagerEventIPCName
}

// ------ OverlayClient events & types

export interface OverlayClientState {
  config: OverlayConfig
  
  session: OverlaySessionData
  
  mode: OverlayMode
}


/**
 * Overlay client event types `manager -> client`
 */
export enum OverlayClientEventType {
  OVERLAY_CONFIG = "OVERLAY_CONFIG",
  OVERLAY_MODE = "OVERLAY_MODE",
  STATE_CHANGED = "STATE_CHANGED"
}

/**
 * Overlay event handler signatures `manager -> client`
 */
export interface OverlayClientEventArgs extends PluginClientEventArgs {
  [OverlayClientEventType.OVERLAY_CONFIG]: (config: OverlayConfig) => void
  [OverlayClientEventType.OVERLAY_MODE]: (mode: OverlayMode) => void
  [OverlayClientEventType.STATE_CHANGED]: (state: OverlayClientState) => void
  
}

/**
 * Handler type dependent on OverlayClientEventType
 */
export type OverlayClientEventHandler<Type extends keyof OverlayClientEventArgs> = OverlayClientEventArgs[Type]

/**
 * Functions that can be invoked via IPC using `ipcRenderer.invoke`
 */
export enum OverlayClientFnType {
  FETCH_DASHBOARD_CONFIGS = "FETCH_DASHBOARD_CONFIGS",
  FETCH_CONFIG = "FETCH_CONFIG",
  FETCH_SESSION = "FETCH_SESSION",
  SET_OVERLAY_MODE = "SET_OVERLAY_MODE",
  FETCH_OVERLAY_MODE = "FETCH_OVERLAY_MODE",
  CLOSE = "CLOSE"
}

/**
 * Represents a string literal type derived from concatenating
 * "OVERLAY_CLIENT_FN_" with the value of an OverlayClientFnType.
 *
 * This type is primarily used to ensure that IPC (Inter-Process Communication)
 * names for overlay client functions follow a specific naming convention.
 */
export type OverlayClientFnIPCName = `OVERLAY_CLIENT_FN_${OverlayClientFnType}`

/**
 * Converts a given OverlayClient function type to its corresponding IPC name.
 *
 * @param {OverlayClientFnType} type - The type of the OverlayClient function
 *     to be converted.
 * @return {OverlayClientFnIPCName} The corresponding IPC name for the
 *     specified OverlayClient function type.
 */
export function OverlayClientFnTypeToIPCName(type: OverlayClientFnType): OverlayClientFnIPCName {
  return `OVERLAY_CLIENT_FN_${type.toUpperCase()}` as OverlayClientFnIPCName
}

/**
 * OverlayClientEventIPCName is a template literal type that forms a string
 * based on the `OverlayClientEventType` type. This string follows the
 * pattern `OVERLAY_CLIENT_EVENT_${OverlayClientEventType}`.
 *
 * OverlayClientEventType is expected to be a string type representing
 * various kinds of overlay client events. The resulting type is useful
 * for ensuring that event names conform to a specific naming convention.
 */
export type OverlayClientEventIPCName = `OVERLAY_CLIENT_EVENT_${OverlayClientEventType}`

export function OverlayClientEventTypeToIPCName(type: OverlayClientEventType | PluginClientEventType): OverlayClientEventIPCName {
  return `OVERLAY_CLIENT_EVENT_${type.toUpperCase()}` as OverlayClientEventIPCName
}

export interface OverlayConfig {
  overlay: OverlayInfo

  placement: OverlayPlacement
}

export interface OverlaySessionData {
  info: SessionInfoMessage

  timing: SessionTiming

  id: string
}

export interface DefaultOverlayClient {
  readonly config: OverlayConfig
  fetchDashboardConfigs(): Promise<DashboardConfig[]>
  fetchConfig(): Promise<OverlayConfig>

  fetchSession(): Promise<OverlaySessionData>

  close(): Promise<void>
}

export enum OverlayMode {
  NORMAL = "NORMAL",
  EDIT = "EDIT"
}

export namespace OverlayWindowRendererEvents {
  
  
  /**
   * Events emitted by `renderer` to `main`
   *
   * OverlayWindowRendererEventType is an enumeration that represents different
   * types of events emitted by the overlay window renderer. Each enum value
   * corresponds to a specific event that can be triggered during the lifecycle
   * of an overlay window.
   */
  export enum EventType {
    // MOUSE_ENTER = "MOUSE_ENTER",
    // MOUSE_LEAVE = "MOUSE_LEAVE",
    BOUNDS_CHANGED = "BOUNDS_CHANGED",
    CLOSE = "CLOSE"
  }
  
  export type EventIPCName = `OVERLAY_WINDOW_RENDERER_EVENT_${EventType}`
  
  export function EventTypeToIPCName(type:EventType):EventIPCName {
    return `OVERLAY_WINDOW_RENDERER_EVENT_${type.toUpperCase()}` as EventIPCName
  }
}

export namespace OverlayWindowMainEvents {
  /**
   * Events emitted by `main` to `renderer`
   *
   * Enum to represent different types of events that can be sent
   * from the renderer process of an overlay window.
   */
  export enum EventType {
    BOUNDS_CHANGED = "BOUNDS_CHANGED"
  }
  
  export type EventIPCName = `OVERLAY_WINDOW_MAIN_EVENT_${EventType}`
  
  export function EventTypeToIPCName(type:EventType):EventIPCName {
    return `OVERLAY_WINDOW_MAIN_EVENT_${type.toUpperCase()}` as EventIPCName
  }
}