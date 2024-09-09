import { Overlay, OverlayPlacement, OverlayKind } from "vrkit-models"

export enum OverlayManagerEventType {
  STATE_CHANGED = "STATE_CHANGED",
  CREATED = "CREATED",
  REMOVED = "REMOVED",
  BOUNDS_CHANGED = "BOUNDS_CHANGED",
}

export enum OverlayManagerFnType {
  GET_OVERLAY_CONFIG = "GET_OVERLAY_CONFIG",
}

export type OverlayManagerFnIPCName =
    `OVERLAY_MANAGER_FN_${OverlayManagerFnType}`

export function OverlayManagerFnTypeToIPCName(
    type: OverlayManagerFnType
): OverlayManagerFnIPCName {
  return `OVERLAY_MANAGER_FN_${type.toUpperCase()}` as OverlayManagerFnIPCName
}

export type OverlayManagerEventIPCName =
    `OVERLAY_MANAGER_EVENT_${OverlayManagerEventType}`

export function OverlayManagerEventTypeToIPCName(
    type: OverlayManagerEventType
): OverlayManagerEventIPCName {
  return `OVERLAY_MANAGER_EVENT_${type.toUpperCase()}` as OverlayManagerEventIPCName
}


export interface OverlayConfig {
  overlay: Overlay
  placement: OverlayPlacement
}

export interface OverlayManagerClient {
  getOverlayConfig(id: string): Promise<OverlayConfig>
  closeOverlay(id: string): Promise<string>
}

