// import { createEntityAdapter, EntityState,createSelector } from "@reduxjs/toolkit"
// import { get } from "lodash/fp"
import { SessionData, SessionTiming, SessionType } from "vrkit-models"
import { SessionInfoMessage } from "vrkit-native-interop"

export type SessionPlayerId = string | "SESSION_TYPE_LIVE"

export const LiveSessionId:SessionPlayerId = "SESSION_TYPE_LIVE"



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

export interface SessionManagerState {
  liveSession?: SessionDetail
  activeSession?: SessionDetail
  sessionIds: Set<SessionPlayerId>
}

