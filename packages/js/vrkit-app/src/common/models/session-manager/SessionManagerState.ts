import { SessionData, SessionTiming, SessionType } from "vrkit-models"
import type { SessionPlayerId, SessionInfoMessage } from "vrkit-native-interop"
export { SessionPlayerId }

export const LiveSessionId: SessionPlayerId = "SESSION_TYPE_LIVE"

export interface SessionDetail {
  id?: string
  type?: SessionType
  filePath?: string
  isAvailable?: boolean
  data?:SessionData
  timing?:SessionTiming
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
  diskSession: sessionDetailDefaults(),
})

export enum SessionManagerEventType {
  UNKNOWN = "UNKNOWN",
  STATE_CHANGED = "STATE_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}
