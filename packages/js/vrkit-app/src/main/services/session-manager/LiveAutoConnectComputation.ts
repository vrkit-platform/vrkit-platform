import { getLogger } from "@3fv/logger-proxy"
import { MainSharedAppState } from "../store"
import {
  ActiveSessionType,
  CachedStateComputation,
  CachedStateComputationChangeEvent, isTrue
} from "@vrkit-platform/shared"
import { asOption } from "@3fv/prelude-ts"
import { isNumber } from "@3fv/guard"

const log = getLogger(__filename)

export type LiveAutoConnectTypes = [
  MainSharedAppState,
  sourceSelectorResult: [
    isAutoConnectEnabled: boolean,
    liveIsAvailable: boolean,
    activeSessionType: ActiveSessionType,
    liveSessionId: number
  ],
  sessionId: number, // should connect to live
  cachedSessionIds: Set<number> // liveSessionIds cache
]

export type LiveAutoConnectChangeEvent = CachedStateComputationChangeEvent<
    LiveAutoConnectTypes[0],
    LiveAutoConnectTypes[1],
    LiveAutoConnectTypes[2],
    LiveAutoConnectTypes[3]
>

export class LiveAutoConnectComputation extends CachedStateComputation<LiveAutoConnectTypes[0],
    LiveAutoConnectTypes[1],
    LiveAutoConnectTypes[2],
    LiveAutoConnectTypes[3]
> {
  constructor(sharedAppState: MainSharedAppState) {
    super(
        sharedAppState,
        // SELECTOR
        (state: MainSharedAppState, selectorState) => [
          state.appSettings.autoconnect,
          state.sessions.liveSession?.isAvailable ?? false,
          state.sessions.activeSessionType,
          state.sessions.liveSession?.info?.weekendInfo?.sessionID ?? 0
        ],
        // TRANSFORM
        ([isAutoConnectEnabled, isAvailable, activeSessionType, liveSessionId], _oldValues, state) => {
          if (log.isDebugEnabled())
            log.debug("LiveAutoConnect transform with", {isAutoConnectEnabled, isAvailable, activeSessionType, liveSessionId})
          if (!isAutoConnectEnabled || !isAvailable || activeSessionType !== "NONE" || !liveSessionId) {
            return 0
          }
          
          const cache = state.customCache,
              isNewSessionId = !cache.has(liveSessionId)
          
          if (isNewSessionId) cache.add(liveSessionId)
          
          return isNewSessionId ? liveSessionId : 0
        },
        {
          startImmediate: false,
          predicate: ({ target, source }) => asOption(target)
              .filter(isNumber)
              .filter(it => it > 0)
              .match({
                None: () => false,
                Some: () => true
              }) && source.slice(0,2).every(isTrue),
          customCacheInit: () => new Set<number>()
        }
    )
  }
}