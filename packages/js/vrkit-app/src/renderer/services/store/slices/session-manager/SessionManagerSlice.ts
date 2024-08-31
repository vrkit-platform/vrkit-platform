import { getLogger } from "@3fv/logger-proxy"
import {
  EntityAdapter,
  createSlice,
  PayloadAction,
  EntityStateAdapter
} from "@reduxjs/toolkit"
import type {
  ActiveSession,
  SessionManagerState,
  SessionPlayerId
} from "./SessionManagerState"

const log = getLogger(__filename)
const { info, debug, warn, error } = log


/**
 * New initial state instance
 *
 * @returns {SessionManagerState}
 */
const newSessionState = (): SessionManagerState => ({
  liveSessionConnected: false,
  sessionIds: new Set<string>()
})


const slice = createSlice({
  name: "sessionManager",
  initialState: newSessionState(),
  reducers: {
    patch: (state: SessionManagerState, action: PayloadAction<Partial<SessionManagerState>>) => {
      Object.assign(state, action.payload ?? {})
    },
    
    setLiveSessionConnected(
      state,
      { payload: liveSessionConnected }: PayloadAction<boolean>
    ) {
      state.liveSessionConnected = liveSessionConnected
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
        { payload: activeSession = {} }: PayloadAction<ActiveSession>
    ) {
      state.activeSession = activeSession
      return state
    },
    
    updateActiveSession(
        state,
        { payload: activeSession = {} }: PayloadAction<ActiveSession>
    ) {
      state.activeSession = {...state.activeSession, ...activeSession}
      return state
    },
        
        // setSelectedWorkspaceId(
    //   state,
    //   { payload: workspaceId }: PayloadAction<string>
    // ) {
    //   state.selectedWorkspaceId = workspaceId
    //   return state
    // },

  },
  extraReducers: builder =>
    builder,
  selectors: {
    selectIsLiveSessionConnected: (state: SessionManagerState) => state.liveSessionConnected,
    selectSessionIds:(state: SessionManagerState) => state.sessionIds,
    selectActiveSession: (state: SessionManagerState) => state.activeSession,
    selectActiveSessionData: (state: SessionManagerState) => state.activeSession?.data,
    selectActiveSessionId: (state: SessionManagerState) => state.activeSession?.id,
    selectActiveSessionTiming: (state: SessionManagerState) => state.activeSession?.timing
  }
    
})

/**
 * Reducer and generated actions
 */
export const { reducer: sessionManagerReducer, actions: sessionManagerActions, selectors: sessionManagerSelectors } = slice

export default slice
