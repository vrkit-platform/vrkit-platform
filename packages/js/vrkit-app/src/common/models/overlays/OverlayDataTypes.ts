import { defaults } from "vrkit-app-common/utils"
import { OverlayConfig } from "vrkit-models"
import type { PluginClientEventArgs, PluginClientEventType } from "vrkit-plugin-sdk"
import { createSimpleSchema, custom, list, primitive } from "serializr"
import { isString } from "@3fv/guard"
import { uniq } from "lodash"

export enum OverlayWindowRole {
  NONE = "NONE",
  OVERLAY = "OVERLAY",
  SCREEN_EDITOR_INFO = "SCREEN_EDITOR_INFO",
  VR_EDITOR_INFO = "VR_EDITOR_INFO"
}

export const OverlaySpecialIds = {
  [OverlayWindowRole.VR_EDITOR_INFO]: `::VRKIT::INTERNAL::${OverlayWindowRole.VR_EDITOR_INFO}`,
  [OverlayWindowRole.SCREEN_EDITOR_INFO]: `::VRKIT::INTERNAL::${OverlayWindowRole.SCREEN_EDITOR_INFO}`
}


export enum OverlayVREditorEventType {
  STATE_CHANGED = "STATE_CHANGED"
}


/**
 * OverlayVREditorEventIPCName -> ipc channel name conversion
 */
export type OverlayVREditorEventIPCName = `OVERLAY_VR_EDITOR_EVENT_${OverlayManagerEventType}`

/**
 * OverlayVREditorEventTypeToIPCName
 *
 * @param type
 * @constructor
 */
export function OverlayVREditorEventTypeToIPCName(type: OverlayVREditorEventType): OverlayVREditorEventIPCName {
  return `OVERLAY_VR_EDITOR_EVENT_${type.toUpperCase()}` as OverlayVREditorEventIPCName
}

export const OverlayVREditorEventIPCNames = uniq(Object.keys(OverlayVREditorEventType).filter(isString))
    .reduce((map, name) =>
        ({
          ...map, [name as OverlayVREditorEventType]:  OverlayVREditorEventTypeToIPCName(name as OverlayVREditorEventType)
        }), {} as Record<OverlayVREditorEventType, string>)


/**
 * Functions that can be invoked via IPC using `ipcRenderer.invoke`
 */
export enum OverlayVREditorFnType {
  FETCH_STATE = "FETCH_STATE"
}

/**
 * Represents a string literal type derived from concatenating
 * "OVERLAY_VR_EDITOR_FN_" with the value of an OverlayClientFnType.
 *
 * This type is primarily used to ensure that IPC (Inter-Process Communication)
 * names for overlay client functions follow a specific naming convention.
 */
export type OverlayVREditorFnIPCName = `OVERLAY_VR_EDITOR_FN_${OverlayVREditorFnType}`

/**
 * Converts a given OverlayVREditor function type to its corresponding IPC name.
 *
 * @param {OverlayVREditorFnType} type - The type of the OverlayClient
 *     function to be converted.
 * @return {OverlayVREditorFnIPCName} The corresponding IPC name for the
 *     specified OverlayClient function type.
 */
export function OverlayVREditorFnTypeToIPCName(type: OverlayVREditorFnType): OverlayVREditorFnIPCName {
  return `OVERLAY_VR_EDITOR_FN_${type.toUpperCase()}` as OverlayVREditorFnIPCName
}

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

/**
 * Overlay client event types `manager -> client`
 */
export enum OverlayManagerClientEventType {
  OVERLAY_CONFIG = "OVERLAY_CONFIG"
}

/**
 * Overlay event handler signatures `manager -> client`
 */
export interface OverlayManagerClientEventArgs extends PluginClientEventArgs {
  [OverlayManagerClientEventType.OVERLAY_CONFIG]: (config: OverlayConfig) => void
}

/**
 * Handler type dependent on OverlayClientEventType
 */
export type OverlayManagerClientEventHandler<Type extends keyof OverlayManagerClientEventArgs> =
  OverlayManagerClientEventArgs[Type]

/**
 * Functions that can be invoked via IPC using `ipcRenderer.invoke`
 */
export enum OverlayManagerClientFnType {
  FETCH_WINDOW_ROLE = "FETCH_WINDOW_ROLE",
  FETCH_CONFIG = "FETCH_CONFIG",
  FETCH_CONFIG_ID = "FETCH_CONFIG_ID",
  SET_EDITOR_ENABLED = "SET_EDITOR_ENABLED",
  CLOSE = "CLOSE"
}

/**
 * Represents a string literal type derived from concatenating
 * "OVERLAY_MANAGER_CLIENT_FN_" with the value of an OverlayClientFnType.
 *
 * This type is primarily used to ensure that IPC (Inter-Process Communication)
 * names for overlay client functions follow a specific naming convention.
 */
export type OverlayManagerClientFnIPCName = `OVERLAY_MANAGER_CLIENT_FN_${OverlayManagerClientFnType}`

/**
 * Converts a given OverlayClient function type to its corresponding IPC name.
 *
 * @param {OverlayManagerClientFnType} type - The type of the OverlayClient
 *     function to be converted.
 * @return {OverlayManagerClientFnIPCName} The corresponding IPC name for the
 *     specified OverlayClient function type.
 */
export function OverlayManagerClientFnTypeToIPCName(type: OverlayManagerClientFnType): OverlayManagerClientFnIPCName {
  return `OVERLAY_MANAGER_CLIENT_FN_${type.toUpperCase()}` as OverlayManagerClientFnIPCName
}

/**
 * OverlayClientEventIPCName is a template literal type that forms a string
 * based on the `OverlayClientEventType` type. This string follows the
 * pattern `OVERLAY_MANAGER_CLIENT_EVENT_${OverlayClientEventType}`.
 *
 * OverlayClientEventType is expected to be a string type representing
 * various kinds of overlay client events. The resulting type is useful
 * for ensuring that event names conform to a specific naming convention.
 */
export type OverlayManagerClientEventIPCName = `OVERLAY_MANAGER_CLIENT_EVENT_${OverlayManagerClientEventType}`

export function OverlayClientEventTypeToIPCName(
  type: OverlayManagerClientEventType | PluginClientEventType
): OverlayManagerClientEventIPCName {
  return `OVERLAY_MANAGER_CLIENT_EVENT_${type.toUpperCase()}` as OverlayManagerClientEventIPCName
}

// export interface OverlayConfig {
//   overlay: OverlayInfo
//
//   placement: OverlayPlacement
// }

// export interface OverlaySessionData {
//   info: SessionInfoMessage
//
//   timing: SessionTiming
//
//   id: string
// }

export interface DefaultOverlayManagerClient {
  readonly overlayConfig: OverlayConfig
  readonly windowRole: OverlayWindowRole
  
  fetchOverlayWindowRole(): Promise<OverlayWindowRole>
  fetchOverlayConfig(): Promise<OverlayConfig>

  close(): Promise<void>
}
//
// export enum OverlayMode {
//   NORMAL = "NORMAL",
//   EDIT = "EDIT"
// }

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
    BOUNDS_CHANGED = "BOUNDS_CHANGED",
    CLOSE = "CLOSE"
  }

  export type EventIPCName = `OVERLAY_WINDOW_RENDERER_EVENT_${EventType}`

  export function EventTypeToIPCName(type: EventType): EventIPCName {
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

  export function EventTypeToIPCName(type: EventType): EventIPCName {
    return `OVERLAY_WINDOW_MAIN_EVENT_${type.toUpperCase()}` as EventIPCName
  }
}