import {
  OverlayConfig,
  OverlayPlacement
} from "@vrkit-platform/models"
import type { IPluginClientEventArgs, PluginClientEventType } from "@vrkit-platform/plugin-sdk"
import {
  toPositionI,
  toSizeI
} from "../../utils/geometry/SizeTools"

export enum OverlayWindowRole {
  NONE = "NONE",
  OVERLAY = "OVERLAY",
  EDITOR_INFO = "EDITOR_INFO"
}

export const OverlaySpecialIds = {
  [OverlayWindowRole.EDITOR_INFO]: `::VRKIT::INTERNAL::${OverlayWindowRole.EDITOR_INFO}`
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
export interface OverlayManagerClientEventArgs extends IPluginClientEventArgs {
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
  SET_VR_LAYOUT = "SET_VR_LAYOUT",
  CLOSE = "CLOSE",
  OPEN_DEV_TOOLS = "OPEN_DEV_TOOLS",
  RELOAD_WINDOW = "RELOAD_WINDOW",
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

export interface DefaultOverlayManagerClient {
  readonly overlayConfig: OverlayConfig
  readonly windowRole: OverlayWindowRole
  
  fetchOverlayWindowRole(): Promise<OverlayWindowRole>
  fetchOverlayConfig(): Promise<OverlayConfig>

  close(): Promise<void>
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

export function overlayPlacementToJson(placement: OverlayPlacement) {
  const newPlacement = OverlayPlacement.clone(placement)
  newPlacement.screenRect.size = toSizeI(newPlacement.screenRect.size)
  newPlacement.screenRect.position = toPositionI(newPlacement.screenRect.position)
  return OverlayPlacement.toJson(newPlacement)
}