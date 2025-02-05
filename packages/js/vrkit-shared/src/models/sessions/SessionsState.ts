import { SessionData, SessionTiming, SessionType } from "@vrkit-platform/models"
import type { SessionPlayerId } from "vrkit-native-interop"
import type {
  SessionInfoMessage
} from "@vrkit-platform/plugin-sdk"
import { omit } from "lodash"
import { toJS } from "mobx"

export { SessionPlayerId }

export const LiveSessionId: SessionPlayerId = "SESSION_TYPE_LIVE"



export function toSessionTimeAndDuration(timing: SessionTiming) {
  return omit(toJS(timing), ["sampleIndex", "sampleCount", "ticks", "tickCount"])
}

export interface SessionDetail {
  id?: string

  type?: SessionType

  filePath?: string

  isAvailable?: boolean

  data?: SessionData
  
  info?: SessionInfoMessage
}

export const sessionDetailDefaults = (): SessionDetail => ({
  isAvailable: false,
  id: ""
})

export type ActiveSessionType = "LIVE" | "DISK" | "NONE"

export interface SessionsState {
  liveSession?: SessionDetail

  diskSession?: SessionDetail

  activeSessionType?: ActiveSessionType
  
  activeSessionId?: string
  
  componentDataVars?: Record<string, string[]>
}

export const newSessionsState = (): SessionsState => ({
  componentDataVars: {},
  activeSessionType: "NONE",
  activeSessionId: "",
  liveSession: sessionDetailDefaults(),
  diskSession: sessionDetailDefaults()
})

export type SessionManagerStateSessionKey = keyof Pick<
  SessionsState,
  "liveSession" | "diskSession"
>

export enum SessionManagerEventType {
  TIMING_CHANGED = "TIMING_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}

export type SessionManagerEventTypes = `${SessionManagerEventType}`

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
  SET_LIVE_SESSION_ACTIVE = "SET_LIVE_SESSION_ACTIVE",
  CLOSE_DISK_SESSION = "CLOSE_DISK_SESSION",
  SHOW_OPEN_DISK_SESSION = "SHOW_OPEN_DISK_SESSION"
}

export type SessionManagerFnIPCName =
  `SESSION_MANAGER_FN_${SessionManagerFnType}`

export function SessionManagerFnTypeToIPCName(
  type: SessionManagerFnType
): SessionManagerFnIPCName {
  return `SESSION_MANAGER_FN_${type.toUpperCase()}` as SessionManagerFnIPCName
}

export type SessionManagerStatePatchFn = (state: SessionsState) => Partial<SessionsState>