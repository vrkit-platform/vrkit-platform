import { getLogger } from "@3fv/logger-proxy"

import { PostConstruct, Singleton } from "@3fv/ditsy"
import {
  ActiveSessionType,
  Bind,
  CachedStateComputationEventType,
  Disposables,
  isEqual,
  isNotEmpty,
  LiveSessionId,
  propEqualTo,
  SessionDetail,
  sessionDetailDefaults,
  SessionManagerEventType,
  SessionManagerEventTypeToIPCName,
  SessionManagerFnType,
  SessionManagerFnTypeToIPCName,
  SessionManagerStatePatchFn,
  SessionManagerStateSessionKey,
  SessionPlayerId,
  SessionsState,
  toSessionTimeAndDuration,
  valuesOf
} from "@vrkit-platform/shared"

import {
  GetLiveVRKitSessionPlayer,
  isLivePlayer,
  SessionPlayer,
  SessionPlayerEventDataDefault
} from "vrkit-native-interop"
import { isDefined, isFunction, isString } from "@3fv/guard"
import {
  SessionData,
  SessionDataVariableValueMap,
  SessionEventData,
  SessionEventType,
  SessionTiming
} from "@vrkit-platform/models"
import { first, flatten, isEmpty, uniq } from "lodash"
import { asOption } from "@3fv/prelude-ts"
import EventEmitter3 from "eventemitter3"
import { app, dialog, ipcMain, IpcMainInvokeEvent } from "electron"
import { get } from "lodash/fp"
import { Deferred } from "@3fv/deferred"
import { match, P } from "ts-pattern"
import { WindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { action, observe, remove, runInAction, set, toJS } from "mobx"
import { SessionPlayerContainer } from "./SessionPlayerContainer"
import { LiveAutoConnectChangeEvent, LiveAutoConnectComputation } from "./LiveAutoConnectComputation"
import { AppSettingsService } from "../app-settings"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export interface SessionManagerEventArgs {
  [SessionManagerEventType.DATA_FRAME]: (
    sessionId: string,
    timing: SessionTiming,
    dataVarValues: SessionDataVariableValueMap
  ) => void
}

function getWeekendInfo(session: SessionDetail) {
  return session?.info?.weekendInfo
}

@Singleton()
export class SessionManager extends EventEmitter3<SessionManagerEventArgs> {
  private readonly disposers_ = new Disposables()

  private get state() {
    return this.sharedAppState.sessions
  }

  private readonly liveAutoConnectComputation_: LiveAutoConnectComputation

  private pendingOpenDiskPlayerDeferred_: Deferred<string> = null

  private livePlayerContainer_: SessionPlayerContainer = null

  private diskPlayerContainer_: SessionPlayerContainer = null

  private get playerContainers_(): SessionPlayerContainer[] {
    return [this.livePlayerContainer_, this.diskPlayerContainer_]
  }

  private getContainerByPlayer(player: SessionPlayer): SessionPlayerContainer {
    return this.playerContainers_.filter(isDefined).find(({ id }) => id === player.id)
  }

  @Bind
  private onEventSessionStateChange(player: SessionPlayer, ev: SessionPlayerEventDataDefault) {
    if (!this.checkPlayerIsManaged(player)) {
      log.warn("Player is not currently managed & has been removed", player.id)
      return
    }

    if (!ev?.payload) {
      warn(`No event payload`, ev)
      return
    }

    this.updateSession(player, ev.payload)
  }
  
  @Bind
  private onEventSessionInfoChanged(player: SessionPlayer, ev: SessionPlayerEventDataDefault) {
    log.debug(`SESSION INFO CHANGED`)
    if (!this.checkPlayerIsManaged(player)) {
      log.warn("Player is not currently managed & has been removed", player.id)
      return
    }
    
    // if (!ev?.payload) {
    //   warn(`No event payload`, ev)
    //   return
    // }
    
    this.updateSession(player, ev.payload)
  }

  @Bind
  registerComponentDataVars(componentId: string, ...dataVarNameArgs: Array<string | string[]>) {
    runInAction(() => {
      set(this.state.componentDataVars, componentId, uniq(flatten(dataVarNameArgs)))
    })
  }

  @Bind
  unregisterComponentDataVars(componentId: string) {
    runInAction(() => {
      remove(this.state.componentDataVars, componentId)
    })
  }

  @Bind
  onComponentDataVarsChanged() {
    this.configureDataVarNames()
  }

  get allComponentDataVars() {
    return uniq(flatten(valuesOf(this.state.componentDataVars)))
  }

  /**
   * Connects to live session automatically when triggered
   *
   * @param ev
   * @private
   */
  private onLiveAutoConnectChanged(ev: LiveAutoConnectChangeEvent) {
    log.info(`LiveAutoConnectChanged, connecting to LIVE session (${ev.target})`, ev)

    log.assert(
      this.activeSessionType === "NONE",
      `activeSessionType should be NONE, when triggered, but it is ${this.activeSessionType}`
    )
    this.setLiveSessionActive(true)
  }

  @Bind
  private onEventDataFrame(
    player: SessionPlayer,
    data: SessionPlayerEventDataDefault,
    dataVarValues: SessionDataVariableValueMap
  ) {
    const container = this.getContainerByPlayer(player)
    if (!this.checkPlayerIsManaged(player)) {
      log.warn("Player is not currently managed & has been removed", player.id)
      return
    }

    asOption(data.payload?.sessionData?.timing).ifSome(timing => {
      container.setDataFrame(timing, dataVarValues)
      const stateKey: SessionManagerStateSessionKey = isLivePlayer(player) ? "liveSession" : "diskSession",
        timeAndDuration = toSessionTimeAndDuration(timing)

      if (!isEqual(timeAndDuration, toJS(this.state[stateKey].timeAndDuration))) {
        this.patchState({
          [stateKey]: {
            ...this.state[stateKey],
            timeAndDuration
          }
        })
      }
      // TODO: Implement value based SessionDataVariable interface & emit
      this.emit(SessionManagerEventType.DATA_FRAME, player.id, timing, dataVarValues)
    })
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
      containerThisKey = isLivePlayer(player) ? "livePlayerContainer_" : "diskPlayerContainer_"
    container.dispose()

    delete this[containerThisKey]

    return player
  }

  /**
   * Adds a player to the SessionManager, linking it to a specified session ID.
   * Also configures data variable names and sets up event listeners.
   *
   * @param sessionId - The ID of the session to which the player belongs
   * @param player - The `SessionPlayer` instance to be added
   *
   * @returns The created `SessionPlayerContainer` or `null` if the session ID
   *     is already registered
   */
  addPlayer(sessionId: SessionPlayerId, player: SessionPlayer) {
    if (this.getPlayerContainer(sessionId)) {
      error(`${sessionId} is already registered, not adding`, player)
      return null
    }
    this.configureDataVarNames(player)

    const container = new SessionPlayerContainer(sessionId, player)
    player.on(SessionEventType.AVAILABLE, this.onEventSessionStateChange)
    player.on(SessionEventType.INFO_CHANGED, this.onEventSessionInfoChanged)
    player.on(SessionEventType.DATA_FRAME, this.onEventDataFrame)
    container.disposers.push(() => {
      player.off(SessionEventType.AVAILABLE, this.onEventSessionStateChange)
      player.off(SessionEventType.INFO_CHANGED, this.onEventSessionInfoChanged)
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
   * Dispose of remaining resources on garbage collection
   */
  [Symbol.dispose]() {
    debug(`Unloading SessionManager`)
    this.liveAutoConnectComputation_[Symbol.dispose]()
    this.disposers_.dispose()
    Array<SessionPlayerContainer>(...this.playerContainers_.values())
      .filter(isDefined<SessionPlayerContainer>)
      .forEach(container => container.player?.destroy())

    delete this.livePlayerContainer_
    delete this.diskPlayerContainer_
  }

  /**
   * Cleanup resources on unload
   *
   * @param _event
   * @private
   */
  @Bind
  private unload(_event: Event) {
    this[Symbol.dispose]()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  protected async init(): Promise<void> {
    const ipcFnHandlers = Array<[SessionManagerFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any]>(
      [SessionManagerFnType.SET_LIVE_SESSION_ACTIVE, this.setLiveSessionActiveHandler.bind(this)],
      [SessionManagerFnType.SHOW_OPEN_DISK_SESSION, this.showOpenDiskPlayerDialogHandler.bind(this)],
      [SessionManagerFnType.CLOSE_DISK_SESSION, this.closeDiskSessionHandler.bind(this)]
    )

    app.on("quit", this.unload)
    this.disposers_.push(() => {
      app.off("quit", this.unload)
      ipcFnHandlers.forEach(([type]) => ipcMain.removeHandler(SessionManagerFnTypeToIPCName(type)))

      Object.assign(global, {
        sessionManager: undefined
      })
    })

    this.disposers_.push(observe(this.state.componentDataVars, this.onComponentDataVarsChanged))

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(SessionManagerFnTypeToIPCName(type), handler))

    // CREATE THE LIVE PLAYER
    this.createLivePlayer()

    // START COMPUTATIONS
    log.info(`Starting live auto connect computation`)
    this.liveAutoConnectComputation_.start()

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        sessionManager: this
      })
    }
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.disposers_.dispose()
      })
    }
  }

  /**
   * Create & start live player
   */
  private createLivePlayer() {
    this.addPlayer(LiveSessionId, GetLiveVRKitSessionPlayer()).player.start()
  }

  /**
   * Service constructor
   *
   * @param windowManager
   * @param sharedAppState
   * @param appSettings
   */
  constructor(
    readonly windowManager: WindowManager,
    readonly sharedAppState: MainSharedAppState,
    readonly appSettings: AppSettingsService
  ) {
    super()
    this.liveAutoConnectComputation_ = new LiveAutoConnectComputation(sharedAppState).on(
      CachedStateComputationEventType.CHANGED,
      this.onLiveAutoConnectChanged.bind(this)
    )
  }

  /**
   * Convert a `SessionPlayer` to `ActiveSession`
   *
   * @param player
   * @param evData
   * @private
   */
  private toSessionDetailFromPlayer(player: SessionPlayer, evData: SessionEventData): SessionDetail {
    if (!player) {
      return {
        id: "",
        isAvailable: false
      }
    }

    return asOption(evData).match({
      Some: ({ sessionData: data }): SessionDetail => ({
        id: data.id,
        isAvailable: player.isAvailable,
        info: player.sessionInfo,
        data: SessionData.create(data as any),
        timeAndDuration: toSessionTimeAndDuration(data.timing)
      }),
      None: (): SessionDetail => ({
        id: player.id,
        isAvailable: player.isAvailable,
        info: player.sessionInfo,
        data: !player.sessionData ? null : player.sessionData, // instanceof
        timeAndDuration: toSessionTimeAndDuration(player.sessionTiming)
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
    return this.getActiveSessionFromState()
  }

  /**
   * Get current active session id
   */
  get activeSessionId(): string {
    return this.state.activeSessionId
  }

  getActiveSessionFromState(state: SessionsState = this.state): SessionDetail {
    const type = state.activeSessionType
    return type === "DISK" ? state.diskSession : type === "LIVE" ? state.liveSession : null
  }

  @Bind
  setLiveSessionActive(active: boolean): ActiveSessionType {
    const activeSessionType: ActiveSessionType = active ? "LIVE" : "NONE"
    if (activeSessionType !== this.activeSessionType) {
      this.patchState({
        activeSessionType,
        activeSessionId: activeSessionType === "LIVE" ? LiveSessionId : ""
      })
    }
    return activeSessionType
  }

  @Bind
  async setLiveSessionActiveHandler(event: IpcMainInvokeEvent, active: boolean): Promise<ActiveSessionType> {
    log.info(`Received handler callback setActiveSessionTypeHandler`, event)
    return this.setLiveSessionActive(active)
  }

  @Bind
  hasActiveSession() {
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
    data: SessionEventData,
    activeSessionType: ActiveSessionType = this.state.activeSessionType
  ) {
    const player = playerOrContainer instanceof SessionPlayerContainer ? playerOrContainer.player : playerOrContainer

    log.assert(!!player,`Invalid playerOrContainer`)

    const sessionDetail = this.toSessionDetailFromPlayer(player, data)
    const { isAvailable } = sessionDetail

    const isLive = isLivePlayer(player)
    const stateKey: SessionManagerStateSessionKey = isLive ? "liveSession" : "diskSession"

    match([isLive, activeSessionType, isAvailable, this.appSettings.isAutoConnectEnabled])
      .with([true, "NONE", true, true], () => {
        activeSessionType = "LIVE"
      })
      .with([true, "LIVE", false, P._], () => {
        activeSessionType = "NONE"
      })
      .with([false, "DISK", false, P._], () => {
        activeSessionType = "NONE"
      })
      .with([false, "LIVE", false, P._], () => {
        activeSessionType = "NONE"
      })
      .otherwise(() => {
        // NO STATE CHANGE HERE
      })

    this.patchState({
      activeSessionId: sessionDetail?.id,
      activeSessionType,
      [stateKey]: {
        ...this.state[stateKey],
        ...sessionDetail
      }
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
    const player = SessionPlayer.Create(filePath)
    player.start()

    this.addPlayer(filePath, player)

    this.updateSession(player, null, "DISK")
    this.configureDataVarNames(player)
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

    this.diskPlayerContainer_ = null

    if (activeSessionType === "DISK") {
      activeSessionType = "NONE"
    }

    this.patchState({
      diskSession: sessionDetailDefaults(),
      activeSessionType,
      activeSessionId: ""
    })
  }

  @Bind
  async closeDiskSessionHandler(event: IpcMainInvokeEvent): Promise<boolean> {
    info(`Received closeDiskSessionHandler`, event)
    this.closeDiskSession()
    return true
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
    return this.playerContainers_.filter(isDefined).some(propEqualTo("id", sessionId))
  }

  getPlayerContainer(sessionId: SessionPlayerId): SessionPlayerContainer {
    return this.playerContainers_.filter(isDefined).find(propEqualTo("id", sessionId))
  }

  getActivePlayer(): SessionPlayer {
    const id = this.activeSession?.id
    return !id ? null : this.getPlayerContainer(id)?.player
  }

  /**
   * Merge & patch SessionManagerState slice
   */

  @action
  @Bind
  private patchState(newStateOrFn: Partial<SessionsState> | SessionManagerStatePatchFn = {}): void {
    const currentState = this.state,
      currentActiveSessionType = currentState.activeSessionType,
      currentActiveSession = this.getActiveSessionFromState(currentState),
      currentActiveSessionId = getWeekendInfo(currentActiveSession)?.sessionID

    runInAction(() => {
      const newStatePatch = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn

      this.sharedAppState.updateSessions(newStatePatch)
    })
  }

  /**
   * Generate broadcast/emit function.  This emits via it's super
   * class `EventEmitter3` & sends it to all browser windows
   *
   * @param type
   * @param args
   * @private
   */
  private broadcast(type: SessionManagerEventType, ...args: any[]): void {
    const ipcEventName = SessionManagerEventTypeToIPCName(type)
    ;(this.emit as any)(type, ...args)

    asOption(this.windowManager?.mainWindow).ifSome(win => {
      win.webContents?.send(ipcEventName, ...args)
    })
  }

  /**
   * Handles the event to show the disk player open dialog.
   *
   * @param {IpcMainInvokeEvent} event - The event object from IPC invoke.
   * @return {Promise<string>} A promise that resolves with the selected file
   *     path or rejects with an error.
   */
  @Bind
  async showOpenDiskPlayerDialogHandler(event: IpcMainInvokeEvent): Promise<string> {
    info(`Received showOpenDiskPlayerDialog event`)
    if (this.pendingOpenDiskPlayerDeferred_ && !this.pendingOpenDiskPlayerDeferred_.isSettled()) {
      log.warn("Pending show open dialog is not completed yet, ignoring call")
      return this.pendingOpenDiskPlayerDeferred_.promise
    }

    const deferred = (this.pendingOpenDiskPlayerDeferred_ = new Deferred<string>())

    try {
      const res = await dialog.showOpenDialog({
        properties: ["openFile", "openDirectory"]
      })

      log.info("Selected file to open as session", res)
      if (res.canceled || isEmpty(res.filePaths)) {
        throw Error("showOpenDiskPlayerDialog cancelled or no file")
      }

      const filePath = first(res.filePaths)
      await this.createDiskPlayer(filePath)

      deferred.resolve(filePath)
    } catch (err) {
      log.error("Unable to open disk session", err)
      deferred.reject(err)
    } finally {
      this.pendingOpenDiskPlayerDeferred_ = null
    }

    return deferred.promise
  }

  /**
   * Configure the data variables that are collected on each data frame
   * for 1..n players.  If no valid players are specified then all
   * available players are updated
   *
   * @param sessionPlayers
   * @private
   */
  private configureDataVarNames(...sessionPlayers: SessionPlayer[]): void {
    runInAction(() => {
      const dataVarNames = this.allComponentDataVars

      asOption(sessionPlayers)
        .filter(isNotEmpty)
        .orCall(() => asOption(Array<SessionPlayer>(this.liveSessionPlayer, this.diskSessionPlayer)))
        .ifSome(players => {
          players.filter(isDefined<SessionPlayer>).forEach(player => {
            player.resetDataVariables(...dataVarNames)
          })
        })
    })
  }
}

export default SessionManager
