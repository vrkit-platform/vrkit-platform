// import { createEntityAdapter, EntityState,createSelector } from "@reduxjs/toolkit"
// import { get } from "lodash/fp"
import { SessionData, SessionTiming, SessionType } from "vrkit-models"
import { SessionInfoMessage } from "vrkit-native-interop"
import { SessionPlayerId, LiveSessionId } from "vrkit-native-interop"
export { SessionPlayerId, LiveSessionId } // from "vrkit-native-interop"


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
  sessionIds: Set<SessionPlayerId>
}

