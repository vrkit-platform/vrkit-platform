import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { APP_STORE_ID, isDev } from "../../constants"

import type { AppStore } from "../store"
import {
  GetLiveVRKitSessionPlayer,
  SessionDataVariable,
  SessionPlayer,
  SessionPlayerEventDataDefault
} from "vrkit-native-interop"
import { isDefined, isString } from "@3fv/guard"
import { SessionEventType } from "vrkit-models"
import {
  LiveSessionId,
  SessionDetail,
  sessionManagerActions,
  sessionManagerSelectors,
  SessionPlayerId
} from "../store/slices/session-manager"
import { isEmpty } from "lodash"
import { asOption } from "@3fv/prelude-ts"
import EventEmitter3 from "eventemitter3"
import { Deferred } from "@3fv/deferred"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

class SessionPlayerContainer {
  readonly disposers = Array<() => void>()

  constructor(
    readonly id: SessionPlayerId,
    readonly player: SessionPlayer
  ) {}

  dispose() {
    this.disposers.forEach(disposer => disposer())
  }
}

export interface SessionManagerEventArgs {
  [SessionEventType.DATA_FRAME]: (dataVars: SessionDataVariable[]) => void
}

@Singleton()
export class SessionManager extends EventEmitter3<SessionManagerEventArgs> {
  private playerContainers = new Map<SessionPlayerId, SessionPlayerContainer>()

  @Bind
  private onEventAvailable(
    player: SessionPlayer,
    ev: SessionPlayerEventDataDefault
  ) {
    if (!ev?.payload) {
      warn(`No event payload`, ev)
      return
    }

    const data = ev.payload
    info(
      `SESSION_EVENT(${SessionEventType[ev.type]}),SESSION(${data.sessionId}): Session availability change event`,
      data
    )
    
    const { activeSession } = this
    
    if (data.sessionId === LiveSessionId) {
      this.updateLiveSession()
    }
    
    if (data.sessionId === activeSession?.id) {
      this.updateActiveSession(player)
    }
  }

  @Bind
  private onEventInfoChanged(
    player: SessionPlayer,
    ev: SessionPlayerEventDataDefault
  ) {
    const { payload: data } = ev
    const { activeSession } = this

    if (activeSession && activeSession?.id !== data.sessionId) {
      debug(`session info changed for non-active session ${data.sessionId}`)
      return
    }
    
    if (data.sessionId === LiveSessionId) {
      this.updateLiveSession()
    }
    
    if (data.sessionId === activeSession?.id) {
      this.updateActiveSession(player)
    }
  }

  @Bind
  private onEventDataFrame(
    player: SessionPlayer,
    data: SessionPlayerEventDataDefault,
    vars: SessionDataVariable[]
  ) {
    // TODO: implement data frame emit
  }

  /**
   * Remove `SessionPlayerContainer` mapped to the id
   * if found, `container.dispose()` is invoked & it
   * is removed from the `players` map
   *
   * @param sessionId
   *
   * @return the container which was removed
   */
  removePlayer(sessionId: SessionPlayerId) {
    if (sessionId === LiveSessionId) {
      warn("LIVE session can not be removed from manager, ignoring")
      return
    }

    if (!this.playerContainers.has(sessionId)) {
      error(`${sessionId} is not registered, not removing player`)
      return null
    }

    const player = this.playerContainers.get(sessionId)
    player.dispose()
    this.playerContainers.delete(sessionId)

    return player
  }

  addPlayer(sessionId: SessionPlayerId, player: SessionPlayer) {
    if (this.playerContainers.has(sessionId)) {
      error(`${sessionId} is already registered, not adding`, player)
      return null
    }
    const container = new SessionPlayerContainer(sessionId, player)
    player.on(SessionEventType.AVAILABLE, this.onEventAvailable)
    player.on(SessionEventType.INFO_CHANGED, this.onEventInfoChanged)
    player.on(SessionEventType.DATA_FRAME, this.onEventDataFrame)
    container.disposers.push(() => {
      player.off(SessionEventType.AVAILABLE, this.onEventAvailable)
      player.off(SessionEventType.INFO_CHANGED, this.onEventInfoChanged)
      player.off(SessionEventType.DATA_FRAME, this.onEventDataFrame)
    })

    this.playerContainers.set(sessionId, container)

    return container
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading Native Manager`)
    Array<SessionPlayerContainer>(...this.playerContainers.values())
      .filter(isDefined<SessionPlayerContainer>)
      .forEach(container => container.player?.destroy())

    this.playerContainers.clear()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)

    if (isDev) {
      Object.assign(global, {
        sessionManager: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            sessionManager: null
          })
        })
      }
    }

    this.createLivePlayer()
  }

  /**
   * Create & start live player
   */
  private createLivePlayer() {
    this.addPlayer(LiveSessionId, GetLiveVRKitSessionPlayer()).player.start()
  }

  /**
   * Update the whole SessionManagerState slice
   */
  updateState() {
    this.updateSessionIds()

    asOption(this.activeSession).match({
      Some: ({ id }) => {
        this.setActiveSession(id)
      },
      None: () => {
        this.updateActiveSession()
      }
    })

    this.updateLiveSession()
  }

  /**
   * Service constructor
   *
   * @param appStore
   */
  constructor(@Inject(APP_STORE_ID) readonly appStore: AppStore) {
    super()
  }

  /**
   * Convert a `SessionPlayer` to `ActiveSession`
   *
   * @param player
   * @private
   */
  private toSessionDetailFromPlayer(player: SessionPlayer): SessionDetail {
    if (!player)
      return {
        id: null
      }

    const {
      isAvailable,
      sessionInfo,
      sessionData: data,
      sessionTiming: timing
    } = player
    return {
      id: data.id,
      type: data.type,
      isAvailable,
      data,
      timing,
      info: sessionInfo
    } as SessionDetail
  }

  /**
   * Get the current active session from the store
   */
  get activeSession(): SessionDetail {
    return sessionManagerSelectors.selectActiveSession(this.appStore.getState())
  }

  @Bind setActiveSession(sessionId: SessionPlayerId) {
    const container = this.playerContainers.get(sessionId)
    if (!container) {
      error(`Player with id ${sessionId} not found, can not set active session`)
      return
    }

    this.updateActiveSession(container)
  }

  @Bind hasActiveSession() {
    const { activeSession } = this
    return isString(activeSession?.id) && !isEmpty(activeSession.id)
  }

  @Bind updateActiveSession(
    playerOrContainer: SessionPlayer | SessionPlayerContainer = null
  ) {
    let container: SessionPlayerContainer =
      playerOrContainer instanceof SessionPlayerContainer
        ? playerOrContainer
        : null
    if (playerOrContainer instanceof SessionPlayer) {
      container = this.playerContainers.get(playerOrContainer.sessionData.id)
    }

    if (!container)
      container = this.playerContainers.get(this.activeSession?.id)

    if (!container) {
      warn(`No current active session & no container provided`)
      return
    }

    const activeSession = this.toSessionDetailFromPlayer(container.player)
    this.appStore.dispatch(
      sessionManagerActions.setActiveSession(activeSession)
    )
  }

  get liveSessionPlayerContainer() {
    const container = this.playerContainers.get(LiveSessionId)
    if (!container) {
      throw Error(`LIVE Player ${LiveSessionId} not found`)
    }
    return container
  }

  /**
   * Get the live session player
   */
  get liveSessionPlayer() {
    return this.liveSessionPlayerContainer?.player
  }

  /**
   * Update the live session connection flag
   *
   * @private
   */
  @Bind
  private updateLiveSession() {
    const container = this.playerContainers.get(LiveSessionId)
    if (!container) {
      throw Error(`LIVE Player ${LiveSessionId} not found`)
    }

    this.appStore.dispatch(
      sessionManagerActions.setLiveSession({
        ...this.toSessionDetailFromPlayer(container.player)
      })
    )
  }

  /**
   * Get sessionIds from state
   */
  get sessionIds() {
    return sessionManagerSelectors.selectSessionIds(this.appStore.getState())
  }

  /**
   * Update session ids in store
   */
  @Bind updateSessionIds() {
    const currentSessionIds = new Set([...this.playerContainers.keys()])
    const sessionIds = this.sessionIds

    asOption(currentSessionIds.difference(sessionIds).size)
      .tap(diffCount => debug(`sessionIds diff count is`, diffCount))
      .filter(diffCount => diffCount > 0)
      .ifSome(diffCount => {
        info(`Updating available session ids diffCount=${diffCount}`)

        this.appStore.dispatch(
          sessionManagerActions.setSessionIds(currentSessionIds)
        )
      })
  }
  
  async createDiskPlayer(filePath:string) {
    const player = new SessionPlayer(filePath)
    player.start()
    
    this.addPlayer(filePath, player)
    
    await Deferred.delay(1500)
    
    this.setActiveSession(filePath)
  }
}

export default SessionManager
