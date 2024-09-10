import { SessionData, SessionTiming, SessionType } from "vrkit-models"
import type { SessionInfoMessage, SessionPlayerId } from "vrkit-native-interop"
export { SessionPlayerId }

export const LiveSessionId: SessionPlayerId = "SESSION_TYPE_LIVE"

export interface SessionDetail {
  id?: string

  type?: SessionType

  filePath?: string

  isAvailable?: boolean

  data?: SessionData

  timing?: SessionTiming

  info?: SessionInfoMessage
}

export const sessionDetailDefaults = (): SessionDetail => ({
  isAvailable: false,
  id: ""
})

export type ActiveSessionType = "LIVE" | "DISK" | "NONE"

export interface SessionManagerState {
  liveSession?: SessionDetail

  diskSession?: SessionDetail

  activeSessionType: ActiveSessionType
}

export const newSessionState = (): SessionManagerState => ({
  activeSessionType: "NONE",
  liveSession: sessionDetailDefaults(),
  diskSession: sessionDetailDefaults()
})

export type SessionManagerStateSessionKey = keyof Pick<
  SessionManagerState,
  "liveSession" | "diskSession"
>

export enum SessionManagerEventType {
  ACTIVE_SESSION_CHANGED = "ACTIVE_SESSION_CHANGED",
  STATE_CHANGED = "STATE_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}

export type SessionManagerEventIPCName =
  `SESSION_MANAGER_EVENT_${SessionManagerEventType}`

export function SessionManagerEventTypeToIPCName(
  type: SessionManagerEventType
): SessionManagerEventIPCName {
  return `SESSION_MANAGER_EVENT_${type.toUpperCase()}` as SessionManagerEventIPCName
}

export enum SessionManagerFnType {
  UNKNOWN = "UNKNOWN",
  GET_STATE = "GET_STATE",
  SET_ACTIVE_SESSION_TYPE = "SET_ACTIVE_SESSION_TYPE",
  CLOSE_DISK_SESSION = "CLOSE_DISK_SESSION",
  SHOW_OPEN_DISK_SESSION = "SHOW_OPEN_DISK_SESSION"
}

export type SessionManagerFnIPCName =
  `SESSION_MANAGER_FN_${SessionManagerEventType}`

export function SessionManagerFnTypeToIPCName(
  type: SessionManagerFnType
): SessionManagerFnIPCName {
  return `SESSION_MANAGER_FN_${type.toUpperCase()}` as SessionManagerFnIPCName
}

export type SessionManagerStatePatchFn = (state: SessionManagerState) => Partial<SessionManagerState>