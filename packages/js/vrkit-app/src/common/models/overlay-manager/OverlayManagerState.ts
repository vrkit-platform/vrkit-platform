import { OverlayInfo, OverlayPlacement, SessionTiming } from "vrkit-models"
import type { SessionDataVariable, SessionInfoMessage } from "vrkit-native-interop" // ------ OverlayManager events & types
import { SessionDataVariableValue } from "../session-manager"

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
  SESSION_INFO = "SESSION_INFO",
  DATA_FRAME = "DATA_FRAME",
  OVERLAY_CONFIG = "OVERLAY_CONFIG"
}

export interface OverlayManagerClientEventArgs {
  [OverlayClientEventType.OVERLAY_CONFIG]: (config: OverlayConfig) => void

  [OverlayClientEventType.DATA_FRAME]: (
    sessionId: string,
    timing: SessionTiming,
    dataVarValues: SessionDataVariableValue<any>[]
  ) => void

  [OverlayClientEventType.SESSION_INFO]: (sessionId: string, info: SessionInfoMessage) => void
}

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

export function OverlayClientEventTypeToIPCName(type: OverlayClientEventType): OverlayClientEventIPCName {
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
