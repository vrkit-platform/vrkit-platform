import { getLogger } from "@3fv/logger-proxy"

import { PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

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
  newSessionState,
  SessionDetail,
  sessionDetailDefaults,
  SessionManagerEventType,
  SessionManagerState,
  SessionPlayerId
} from "vrkit-app-common/models/session-manager"

import { first, isEmpty } from "lodash"
import { asOption } from "@3fv/prelude-ts"
import EventEmitter3 from "eventemitter3"
import { assign, isDev, isNotEmpty, propEqualTo } from "vrkit-app-common/utils"
import { app, dialog, ipcMain } from "electron"
import { get } from "lodash/fp"
import { Deferred } from "@3fv/deferred"

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

export interface SessionManagerEventArgs {
  [SessionManagerEventType.STATE_CHANGED]: (
    newState: SessionManagerState
  ) => void

  [SessionManagerEventType.DATA_FRAME]: (
    dataVars: SessionDataVariable[]
  ) => void
}

@Singleton()
export class SessionManager extends EventEmitter3<SessionManagerEventArgs> {
  private state_ = newSessionState()

  private pendingOpenDiskPlayerDeferred_: Deferred<boolean> = null

  private livePlayerContainer_: SessionPlayerContainer = null

  private diskPlayerContainer_: SessionPlayerContainer = null

  private get playerContainers_() {
    return [this.livePlayerContainer_, this.diskPlayerContainer_]
  }

  private getContainerByPlayer(player: SessionPlayer) {
    return this.playerContainers_
      .filter(isDefined)
      .find(({ id }) => id === player.id)
  }

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

    const { activeSessionType } = this.state
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

    const { player } = container,
      containerThisKey = isLivePlayer(player)
        ? "livePlayerContainer_"
        : "diskPlayerContainer_"
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
    app.on("before-quit", this.unload)

    if (isDev) {
      Object.assign(global, {
        sessionManager: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          app.off("before-quit", this.unload)
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
    this.patchState()
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
  constructor() {
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
    return type === "DISK"
      ? this.diskSession
      : type === "LIVE"
        ? this.liveSession
        : null
  }

  @Bind setActiveSessionType(type: ActiveSessionType) {
    this.patchState({ activeSessionType: type })
  }

  @Bind hasActiveSession() {
    const { activeSession } = this
    return isString(activeSession?.id) && !isEmpty(activeSession.id)
  }

  get liveSessionPlayerContainer() {
    return this.livePlayerContainer_
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
    const isLive = sessionDetail?.id === LiveSessionId
    this.patchState({
      ...(isLive
        ? {
            liveSession: sessionDetail
          }
        : {
            diskSession: sessionDetail
          })
    })
  }

  get diskSessionPlayerContainer() {
    return this.diskPlayerContainer_
  }

  /**
   * Get the live session player
   */
  get diskSessionPlayer() {
    return this.diskSessionPlayerContainer?.player
  }

  get hasDiskSession() {
    return isNotEmpty(this.diskSessionId)
  }

  get diskSessionId(): string {
    return this.diskPlayerContainer_?.player?.id
  }

  get sessionIds() {
    return [...this.playerContainers_].filter(isDefined).map(get("id"))
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
    return this.state.activeSessionType
  }

  closeDiskSession() {
    let { activeSessionType } = this
    const container = this.diskSessionPlayerContainer
    if (container) {
      container.dispose()
      delete this.diskPlayerContainer_
    }

    if (activeSessionType === "DISK") {
      activeSessionType = "NONE"
    }

    this.patchState({
      diskSession: sessionDetailDefaults(),
      activeSessionType
    })
  }

  private checkPlayerIsManaged(player: SessionPlayer): boolean {
    if (!player) {
      log.error(`Player is null`)
      return false
    }
    const container = this.getContainerByPlayer(player)
    if (!container) {
      log.error("Unknown player, can not find container, destroying")
      player.destroy()
      return false
    }

    return true
  }

  hasPlayerContainer(sessionId: SessionPlayerId): boolean {
    return this.playerContainers_
      .filter(isDefined)
      .some(propEqualTo("id", sessionId))
  }

  getPlayerContainer(sessionId: SessionPlayerId): SessionPlayerContainer {
    return this.playerContainers_
      .filter(isDefined)
      .find(propEqualTo("id", sessionId))
  }

  private patchState(newState: Partial<SessionManagerState> = {}): void {
    assign(this.state_, newState)
    this.broadcastState()
  }

  private broadcastState() {
    this.broadcast(SessionManagerEventType.STATE_CHANGED, this.state_)
  }

  private broadcast(type: SessionManagerEventType, ...args: any[]): void {
    ;(this.emit as any)(type, ...args)
    ipcMain.emit("SESSION_MANAGER_EVENT", type, ...args)
  }

  async showOpenDiskPlayerDialog(): Promise<boolean> {
    if (
      this.pendingOpenDiskPlayerDeferred_ &&
      !this.pendingOpenDiskPlayerDeferred_.isSettled()
    ) {
      log.warn("Pending show open dialog is not completed yet, ignoring call")
      return this.pendingOpenDiskPlayerDeferred_.promise
    }

    const deferred = (this.pendingOpenDiskPlayerDeferred_ = new Deferred())

    try {
      const res = await dialog.showOpenDialog({
        properties: ["openFile"]
      })

      log.info("Selected file to open as session", res)
      if (res.canceled || isEmpty(res.filePaths))
        throw Error("showOpenDiskPlayerDialog cancelled or no file")
      
      const filePath = first(res.filePaths)
      await this.createDiskPlayer(filePath)
      
      deferred.resolve(true)
    } catch (err) {
      log.error("Unable to open disk session", err)
      deferred.reject(err)
    } finally {
      this.pendingOpenDiskPlayerDeferred_ = null
    }

    return deferred.promise
  }
}

export default SessionManager
