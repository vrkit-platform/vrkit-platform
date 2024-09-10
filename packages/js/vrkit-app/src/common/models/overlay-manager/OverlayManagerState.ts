import { OverlayInfo, OverlayPlacement, SessionDataVariableValueMap, SessionTiming } from "vrkit-models"
import type { SessionInfoMessage, PluginClientEventArgs, PluginClientEventType } from "vrkit-plugin-sdk" // ------ OverlayManager events & types

// ------ OverlayManager events & types

export enum OverlayManagerEventType {
  STATE_CHANGED = "STATE_CHANGED"
}

export type OverlayManagerEventIPCName = `OVERLAY_MANAGER_EVENT_${OverlayManagerEventType}`

export function OverlayManagerEventTypeToIPCName(type: OverlayManagerEventType): OverlayManagerEventIPCName {
  return `OVERLAY_MANAGER_EVENT_${type.toUpperCase()}` as OverlayManagerEventIPCName
}

// ------ OverlayClient events & types

export enum OverlayClientEventType {
  OVERLAY_CONFIG = "OVERLAY_CONFIG"
}

export interface OverlayClientEventArgs extends PluginClientEventArgs {
  [OverlayClientEventType.OVERLAY_CONFIG]: (config: OverlayConfig) => void
}
export type OverlayClientEventHandler<Type extends keyof OverlayClientEventArgs> = OverlayClientEventArgs[Type]

export enum OverlayClientFnType {
  FETCH_CONFIG = "FETCH_CONFIG",
  FETCH_SESSION = "FETCH_SESSION",
  CLOSE = "CLOSE"
}

export type OverlayClientFnIPCName = `OVERLAY_CLIENT_FN_${OverlayClientFnType}`

export function OverlayClientFnTypeToIPCName(type: OverlayClientFnType): OverlayClientFnIPCName {
  return `OVERLAY_CLIENT_FN_${type.toUpperCase()}` as OverlayClientFnIPCName
}

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

  fetchConfig(): Promise<OverlayConfig>

  fetchSession(): Promise<OverlaySessionData>

  close(): Promise<void>
}
