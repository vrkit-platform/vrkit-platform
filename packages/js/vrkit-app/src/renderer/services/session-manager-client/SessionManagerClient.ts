import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { APP_STORE_ID, isDev } from "../../constants"

import type { AppStore } from "../store"
import {
  GetLiveVRKitSessionPlayer,
  isLivePlayer,
  SessionDataVariable,
  SessionPlayer,
  SessionPlayerEventDataDefault
} from "vrkit-native-interop"
import { isDefined, isString } from "@3fv/guard"
import { SessionEventData, SessionEventType, SessionTiming } from "vrkit-models"
import {
  ActiveSessionType,
  LiveSessionId,
  SessionDetail,
  sessionDetailDefaults,
  SessionManagerState,
  SessionPlayerId
} from "vrkit-app-common/models/session-manager"
// import {
//   sessionManagerActions,
//   sessionManagerSelectors
// } from "../store/slices/session-manager"
import { first, isEmpty } from "lodash"
import { asOption } from "@3fv/prelude-ts"
import EventEmitter3 from "eventemitter3"
import { isNotEmpty, propEqualTo } from "vrkit-app-common/utils"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

class SessionPlayerContainer {
  readonly disposers = Array<() => void>()

  private timing_: SessionTiming = null

  private dataVars_: SessionDataVariable[] = []
  
  get timing() {
    return this.timing_
  }
  
  get dataVars() {
    return this.dataVars_
  }
  
  constructor(
    readonly id: SessionPlayerId,
    readonly player: SessionPlayer
  ) {}

  dispose() {
    this.disposers.forEach(disposer => disposer())
  }

  setDataFrame(timing: SessionTiming, dataVars: SessionDataVariable[]): void {
    this.timing_ = timing
    this.dataVars_ = dataVars
  }
}

export enum SessionManagerEventType {
  UNKNOWN = "UNKNOWN",
  STATE_CHANGED = "STATE_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}

export interface SessionManagerEventArgs {
  [SessionEventType.DATA_FRAME]: (dataVars: SessionDataVariable[]) => void
}

@Singleton()
export class SessionManagerClient extends EventEmitter3<SessionManagerEventArgs> {
  
  
  @Bind
  private onEventSessionStateChange(
    player: SessionPlayer,
    ev: SessionPlayerEventDataDefault
  ) {
    if (!this.checkPlayerIsManaged(player)) {
      log.warn("Player is not currently managed & has been removed", player.id)
      return
    }

    if (!ev?.payload) {
      warn(`No event payload`, ev)
      return
    }

    const data = ev.payload
    info(
      `SESSION_EVENT(${SessionEventType[ev.type]}),SESSION(${data.sessionId}): Session availability change event`,
      data
    )

    this.updateSession(player, data)
  }

  @Bind
  private onEventDataFrame(
    player: SessionPlayer,
    data: SessionPlayerEventDataDefault,
    vars: SessionDataVariable[]
  ) {
    const container = this.getContainerByPlayer(player)
    if (!this.checkPlayerIsManaged(player)) {
      log.warn("Player is not currently managed & has been removed", player.id)
      return
    }
    
    const {activeSessionType} = this.state
    if (activeSessionType === "NONE")
    asOption(data.payload?.sessionData?.timing).ifSome(timing => {
      container.setDataFrame(timing, vars)
      // TODO: Implement emitState
      
      // this.appStore.dispatch(
      //   isLivePlayer(player)
      //     ? sessionManagerActions.updateLiveSessionTiming(timing)
      //     : sessionManagerActions.updateDiskSessionTiming(timing)
      // )
    })
  }
  
  get state() {
    return this.state_
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
  removePlayer(sessionId: SessionPlayerId): SessionPlayer {
    if (sessionId === LiveSessionId) {
      warn("LIVE session can not be removed from manager, ignoring")
      return null
    }
    
    const container = this.getPlayerContainer(sessionId)

    if (!container) {
      error(`${sessionId} is not registered, not removing player`)
      return null
    }

    const
      { player } = container,
      containerThisKey = isLivePlayer(player) ? "livePlayerContainer_" : "diskPlayerContainer_"
    container.dispose()
    
    delete this[containerThisKey]

    return player
  }

  addPlayer(sessionId: SessionPlayerId, player: SessionPlayer) {
    if (this.getPlayerContainer(sessionId)) {
      error(`${sessionId} is already registered, not adding`, player)
      return null
    }
    const container = new SessionPlayerContainer(sessionId, player)
    player.on(SessionEventType.AVAILABLE, this.onEventSessionStateChange)
    player.on(SessionEventType.INFO_CHANGED, this.onEventSessionStateChange)
    player.on(SessionEventType.DATA_FRAME, this.onEventDataFrame)
    container.disposers.push(() => {
      player.off(SessionEventType.AVAILABLE, this.onEventSessionStateChange)
      player.off(SessionEventType.INFO_CHANGED, this.onEventSessionStateChange)
      player.off(SessionEventType.DATA_FRAME, this.onEventDataFrame)
    })
    
    if (isLivePlayer(player)) {
      this.livePlayerContainer_ = container
    } else {
      this.diskPlayerContainer_ = container
    }
    
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
    Array<SessionPlayerContainer>(...this.playerContainers_.values())
      .filter(isDefined<SessionPlayerContainer>)
      .forEach(container => container.player?.destroy())

    // this.playerContainers_.clear()
    delete this.livePlayerContainer_
    delete this.diskPlayerContainer_
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
    this.playerContainers_.forEach(({ player }) => {
      this.updateSession(player, null)
    })
    // asOption(this.activeSession)
    //     // .filter(isDefined)
    //     // .filter(({id}) => isNotEmpty(id))
    //     .match({
    //   Some: ({ id }) => {
    //     this.setActiveSession(id)
    //   },
    //   None: () => {
    //     this.updateActiveSession()
    //   }
    // })
    //
    // this.updateDiskSession()
    // this.updateLiveSession()
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
   * @param evData
   * @private
   */
  private toSessionDetailFromPlayer(
    player: SessionPlayer,
    evData: SessionEventData
  ): SessionDetail {
    if (!player)
      return {
        id: "",
        isAvailable: false
      }

    return asOption(evData).match({
      Some: ({ sessionData: data }): SessionDetail => ({
        id: data.id,
        isAvailable: true,
        info: player.sessionInfo,
        data,
        timing: data.timing
      }),
      None: (): SessionDetail => ({
        id: player.id,
        isAvailable: player.isAvailable,
        info: player.sessionInfo,
        data: player.sessionData,
        timing: player.sessionTiming
      })
    })
  }
  
  get liveSession(): SessionDetail {
    return this.state?.liveSession
  }
  
  get diskSession(): SessionDetail {
    return this.state?.diskSession
  }
  
  
  /**
   * Get the current active session from the store
   */
  get activeSession(): SessionDetail {
    const type = this.state.activeSessionType
    return type === "DISK" ? this.diskSession : type === "LIVE" ? this.liveSession : null
  }

  @Bind setActiveSessionType(type: ActiveSessionType) {
    this.appStore.dispatch(sessionManagerActions.setActiveSessionType(type))
  }

  @Bind hasActiveSession() {
    const { activeSession } = this
    return isString(activeSession?.id) && !isEmpty(activeSession.id)
  }

  get liveSessionPlayerContainer() {
    const container = this.playerContainers_.get(LiveSessionId)
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
  private updateSession(
    playerOrContainer: SessionPlayer | SessionPlayerContainer,
    data: SessionEventData
  ) {
    const player =
      playerOrContainer instanceof SessionPlayerContainer
        ? playerOrContainer.player
        : playerOrContainer
    if (!player) {
      throw Error(`Invalid playerOrContainer`)
    }

    const sessionDetail = this.toSessionDetailFromPlayer(player, data)
    this.appStore.dispatch(
      sessionDetail?.id === LiveSessionId
        ? sessionManagerActions.setLiveSession(sessionDetail)
        : sessionManagerActions.setDiskSession(sessionDetail)
    )
  }

  get diskSessionPlayerContainer() {
    const id = this.diskSessionId
    if (!isNotEmpty(id)) {
      return null
    }

    const container = this.playerContainers_.get(id)
    if (!container) {
      throw Error(`Disk Player ${id} not found`)
    }
    return container
  }

  /**
   * Get the live session player
   */
  get diskSessionPlayer() {
    return this.diskSessionPlayerContainer?.player
  }

  private get hasDiskSession() {
    return isNotEmpty(this.diskSessionIds)
  }

  private get diskSessionIds(): string[] {
    return this.sessionIds.filter(id => id !== LiveSessionId)
  }

  private get diskSessionId(): string {
    return first(this.diskSessionIds)
  }

  /**
   * Get sessionIds from state
   */
  get stateSessionIds() {
    return sessionManagerSelectors.selectSessionIds(this.appStore.getState())
  }

  get sessionIds() {
    return [...this.playerContainers_.keys()]
  }

  /**
   * Update session ids in store
   */
  @Bind updateSessionIds() {
    const currentSessionIds = new Set([...this.playerContainers_.keys()])
    const sessionIds = this.stateSessionIds

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

  async createDiskPlayer(filePath: string) {
    const player = new SessionPlayer(filePath)
    player.start()

    this.addPlayer(filePath, player)

    // await Deferred.delay(1500)

    this.updateSession(player, null)
    this.setActiveSessionType("DISK")
  }

  get activeSessionType() {
    return sessionManagerSelectors.selectActiveSessionType(
      this.appStore.getState()
    )
  }

  closeDiskSession() {
    const { activeSessionType, diskSessionId } = this
    const container = this.playerContainers_.get(diskSessionId)
    if (container) {
      container.dispose()
      this.playerContainers_.delete(diskSessionId)
    }

    if (activeSessionType === "DISK") {
      this.appStore.dispatch(sessionManagerActions.setActiveSessionType("NONE"))
    }

    this.appStore.dispatch(
      sessionManagerActions.setDiskSession(sessionDetailDefaults())
    )
  }

  private checkPlayerIsManaged(player: SessionPlayer): boolean {
    if (!player) {
      log.error(`Player is null`)
      return false
    }
    const container = this.getContainerByPlayer(player)
    if (!container) {
      player.destroy()
      return false
    }

    return true
  }
  
  hasPlayerContainer(sessionId:SessionPlayerId):boolean {
    return this.playerContainers_.filter(isDefined).some(propEqualTo("id", sessionId))
  }
  
  getPlayerContainer(sessionId:SessionPlayerId):SessionPlayerContainer {
    return this.playerContainers_.filter(isDefined).find(propEqualTo("id", sessionId))
  }
}

export default SessionManager
