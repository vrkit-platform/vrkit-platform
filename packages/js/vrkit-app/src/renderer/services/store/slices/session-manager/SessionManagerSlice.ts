import { getLogger } from "@3fv/logger-proxy"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import {
  ActiveSessionType,
  newSessionState,
  type SessionDetail,
  sessionDetailDefaults,
  type SessionManagerState
} from "vrkit-app-common/models/session-manager"
import { assign, Identity, isNotEmpty } from "vrkit-app-common/utils"

import { SessionTiming } from "vrkit-models"
import { OverlayMode } from "vrkit-app-common/models/overlay-manager"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

function createActiveSessionSelector<T>(selector: (session: SessionDetail) => T) {
  return (state: SessionManagerState) =>
    selector(
      state.activeSessionType === "LIVE"
        ? state.liveSession
        : state.activeSessionType === "DISK"
          ? state.diskSession
          : null
    )
}

const slice = createSlice({
  name: "sessionManager",
  initialState: newSessionState(),
  reducers: {
    patch: (state: SessionManagerState, action: PayloadAction<Partial<SessionManagerState>>) => {
      return assign(state, action.payload ?? {})
    },

    setOverlayMode: (state: SessionManagerState, { payload: overlayMode }: PayloadAction<OverlayMode>) => {
      return {
        ...state,
        overlayMode
      }
    },

    setLiveSessionConnected(state, { payload: liveSessionConnected }: PayloadAction<boolean>) {
      state.liveSession = {
        ...state.liveSession,
        isAvailable: liveSessionConnected
      }
      return state
    },

    setActiveSessionType(state, { payload: activeSessionType = "NONE" }: PayloadAction<ActiveSessionType>) {
      state.activeSessionType = activeSessionType
      return state
    },

    setDiskSession(state, { payload: diskSession = sessionDetailDefaults() }: PayloadAction<SessionDetail>) {
      state.diskSession = diskSession
      return state
    },

    updateDiskSession(state, { payload: diskSession = sessionDetailDefaults() }: PayloadAction<SessionDetail>) {
      state.diskSession = { ...state.diskSession, ...diskSession }
      return state
    },

    updateDiskSessionTiming(state, { payload: timing }: PayloadAction<SessionTiming>) {
      state.diskSession.timing = timing
      return state
    },

    setLiveSession(state, { payload: liveSession = sessionDetailDefaults() }: PayloadAction<SessionDetail>) {
      state.liveSession = liveSession
      return state
    },

    updateLiveSession(state, { payload: liveSession = sessionDetailDefaults() }: PayloadAction<SessionDetail>) {
      state.liveSession = { ...state.liveSession, ...liveSession }
      return state
    },

    updateLiveSessionTiming(state, { payload: timing }: PayloadAction<SessionTiming>) {
      state.liveSession.timing = timing
      return state
    }
  },
  extraReducers: builder => builder,
  selectors: {
    selectOverlayMode: (state: SessionManagerState) => state.overlayMode ?? OverlayMode.NORMAL,

    hasAvailableSession: (state: SessionManagerState) =>
      [state.diskSession?.isAvailable, state.liveSession?.isAvailable].some(it => it === true),

    hasActiveSession: (state: SessionManagerState) =>
      isNotEmpty(state.activeSessionType) && state.activeSessionType !== "NONE",

    isLiveSessionAvailable: (state: SessionManagerState) => state.liveSession?.isAvailable === true,

    // Active Session Selectors
    selectActiveSessionType: (state: SessionManagerState) => state.activeSessionType,
    selectActiveSession: createActiveSessionSelector(Identity),
    selectActiveSessionData: createActiveSessionSelector(session => session?.data),
    selectActiveSessionId: createActiveSessionSelector(session => session?.id),
    selectActiveSessionTiming: createActiveSessionSelector(session => session?.timing),
    selectActiveSessionInfo: createActiveSessionSelector(session => session?.info),
    selectActiveSessionWeekendInfo: createActiveSessionSelector(session => session?.info?.weekendInfo),

    // Disk Session Selectors
    selectDiskSession: (state: SessionManagerState) => state.diskSession,

    // Live Session Selectors
    selectLiveSession: (state: SessionManagerState) => (isNotEmpty(state.liveSession?.id) ? state.liveSession : null),
    selectLiveSessionData: (state: SessionManagerState) => state.liveSession?.data,
    selectLiveSessionId: (state: SessionManagerState) => state.liveSession?.id,
    selectLiveSessionTiming: (state: SessionManagerState) => state.liveSession?.timing,
    selectLiveSessionInfo: (state: SessionManagerState) => state.liveSession?.info,
    selectLiveSessionWeekendInfo: (state: SessionManagerState) => state.liveSession?.info?.weekendInfo
  }
})

/**
 * Reducer and generated actions
 */
export const {
  reducer: sessionManagerReducer,
  actions: sessionManagerActions,
  selectors: sessionManagerSelectors
} = slice

export default slice
