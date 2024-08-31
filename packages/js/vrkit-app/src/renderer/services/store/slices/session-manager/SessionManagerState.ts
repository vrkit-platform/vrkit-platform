// import { createEntityAdapter, EntityState,createSelector } from "@reduxjs/toolkit"
// import { get } from "lodash/fp"
import { SessionData, SessionTiming, SessionType } from "vrkit-models"

export type SessionPlayerId = string | "SESSION_TYPE_LIVE"

export const LiveSessionId:SessionPlayerId = "SESSION_TYPE_LIVE"

export interface ActiveSession {
  id?: string
  type?: SessionType
  isAvailable?: boolean
  data?:SessionData
  timing?:SessionTiming
  info?: any
}

export interface SessionManagerState {
  liveSessionConnected: boolean
  sessionIds: Set<SessionPlayerId>
  activeSession?: ActiveSession
}
