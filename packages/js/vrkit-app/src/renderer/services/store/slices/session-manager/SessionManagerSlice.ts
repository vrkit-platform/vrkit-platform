import { getLogger } from "@3fv/logger-proxy"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import {
  type SessionDetail,
  sessionDetailDefaults,
  type SessionManagerState,
  type SessionPlayerId
} from "./SessionManagerState"
import { isNotEmpty } from "vrkit-app-common/utils"
import { isDefined, isString } from "@3fv/guard"
import { get } from "lodash/fp"
import { SessionType } from "vrkit-models"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

/**
 * New initial state instance
 *
 * @returns {SessionManagerState}
 */
const newSessionState = (): SessionManagerState => ({
  activeSession: sessionDetailDefaults(),
  liveSession: sessionDetailDefaults(),
  sessionIds: new Set<string>()
})

const slice = createSlice({
  name: "sessionManager",
  initialState: newSessionState(),
  reducers: {
    patch: (
      state: SessionManagerState,
      action: PayloadAction<Partial<SessionManagerState>>
    ) => {
      Object.assign(state, action.payload ?? {})
    },

    setLiveSessionConnected(
      state,
      { payload: liveSessionConnected }: PayloadAction<boolean>
    ) {
      state.liveSession = {
        ...state.liveSession,
        isAvailable: liveSessionConnected
      }
      return state
    },

    setSessionIds(
      state,
      { payload: sessionIds }: PayloadAction<Set<SessionPlayerId>>
    ) {
      state.sessionIds = sessionIds
      return state
    },

    setActiveSession(
      state,
      { payload: activeSession = {} }: PayloadAction<SessionDetail>
    ) {
      state.activeSession = activeSession
      return state
    },

    updateActiveSession(
      state,
      { payload: activeSession = {} }: PayloadAction<SessionDetail>
    ) {
      state.activeSession = { ...state.activeSession, ...activeSession }
      return state
    },

    setLiveSession(
      state,
      {
        payload: liveSession = { ...sessionDetailDefaults() }
      }: PayloadAction<SessionDetail>
    ) {
      state.liveSession = liveSession
      return state
    },

    updateLiveSession(
      state,
      { payload: liveSession = {} }: PayloadAction<SessionDetail>
    ) {
      state.liveSession = { ...state.liveSession, ...liveSession }
      return state
    }
  },
  extraReducers: builder => builder,
  selectors: {
    hasAvailableSession: (state: SessionManagerState) =>
      [state.activeSession?.isAvailable, state.liveSession?.isAvailable]
        .some(it => it === true),

    hasActiveSession: (state: SessionManagerState) =>
      isNotEmpty(state.activeSession?.id),

    isLiveSessionAvailable: (state: SessionManagerState) =>
      state.liveSession?.isAvailable === true,

    selectSessionIds: (state: SessionManagerState) => state.sessionIds,

    // Active Session Selectors
    selectActiveSession: (state: SessionManagerState) =>
      isNotEmpty(state.activeSession?.id) ? state.activeSession : null,
    selectActiveSessionData: (state: SessionManagerState) =>
      state.activeSession?.data,
    selectActiveSessionId: (state: SessionManagerState) =>
      state.activeSession?.id,
    selectActiveSessionTiming: (state: SessionManagerState) =>
      state.activeSession?.timing,
    selectActiveSessionInfo: (state: SessionManagerState) =>
      state.activeSession?.info,
    selectActiveSessionWeekendInfo: (state: SessionManagerState) =>
      state.activeSession?.info?.weekendInfo,

    // Disk Session Selectors
    selectDiskSession: (state: SessionManagerState) =>
      isNotEmpty(state.activeSession?.id) &&
      isNotEmpty(state.activeSession?.filePath) &&
      state.activeSession?.type === SessionType.DISK
        ? state.activeSession
        : null,

    // Live Session Selectors
    selectLiveSession: (state: SessionManagerState) =>
      isNotEmpty(state.liveSession?.id) ? state.liveSession : null,
    selectLiveSessionData: (state: SessionManagerState) =>
      state.liveSession?.data,
    selectLiveSessionId: (state: SessionManagerState) => state.liveSession?.id,
    selectLiveSessionTiming: (state: SessionManagerState) =>
      state.liveSession?.timing,
    selectLiveSessionInfo: (state: SessionManagerState) =>
      state.liveSession?.info,
    selectLiveSessionWeekendInfo: (state: SessionManagerState) =>
      state.liveSession?.info?.weekendInfo
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
