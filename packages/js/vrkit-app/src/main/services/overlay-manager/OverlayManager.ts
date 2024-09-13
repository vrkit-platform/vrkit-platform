import { getLogger } from "@3fv/logger-proxy"

import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import {
  AppSettings,
  DashboardConfig,
  OverlayInfo,
  OverlayKind,
  OverlayPlacement,
  SessionDataVariableValueMap
} from "vrkit-models"
import { isDefined, isFunction } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import { assign, generateUUID, isDev, isEmpty, isEqual, Pair } from "vrkit-app-common/utils"
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
  IpcMainEvent,
  IpcMainInvokeEvent
} from "electron"
import { Deferred } from "@3fv/deferred"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  OverlayConfig,
  OverlayManagerEventType,
  OverlaySessionData,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents
} from "vrkit-app-common/models/overlay-manager"
import { resolveHtmlPath, windowOptionDefaults } from "../../utils"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import {
  ActiveSessionType,
  SessionDetail,
  SessionManagerEventType,
  SessionManagerState
} from "vrkit-app-common/models/session-manager"
import { PluginClientEventType } from "vrkit-plugin-sdk"
import { AppPaths, FileExtensions } from "vrkit-app-common/constants"
import { AppSettingsService } from "../app-settings"
import Fsx from "fs-extra"
import { endsWith } from "lodash/fp"
import Path from "path"
import { first } from "lodash"
import PQueue from "p-queue"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

export type OverlayManagerStatePatchFn = (state: OverlayManagerState) => Partial<OverlayManagerState>

export class OverlayWindow {
  private readonly window_: BrowserWindow

  private readonly config_: OverlayConfig

  private readonly readyDeferred_ = new Deferred<OverlayWindow>()

  private closeDeferred: Deferred<void> = null

  readonly windowOptions: BrowserWindowConstructorOptions

  @Bind
  private onIPCMouseEnter(ev: IpcMainEvent) {
    const fromWin = BrowserWindow.fromWebContents(ev?.sender)
    if (fromWin?.id !== this.window_?.id) {
      return
    }

    this.setIgnoreMouseEvents(false)
  }

  @Bind
  private onIPCMouseLeave(ev: IpcMainEvent) {
    const fromWin = BrowserWindow.fromWebContents(ev?.sender)
    if (fromWin?.id !== this.window_?.id) {
      return
    }

    this.setIgnoreMouseEvents(true)
  }

  /**
   * Get the browser window
   */
  get window() {
    return this.window_
  }

  get windowId() {
    return this.window_?.id
  }

  get isClosing() {
    return !!this.closeDeferred
  }

  get isClosed() {
    return this.isClosing && this.closeDeferred.isSettled()
  }

  /**
   * Close the window
   */
  close(): Promise<void> {
    if (this.closeDeferred) {
      return this.closeDeferred.promise
    }

    const deferred = (this.closeDeferred = new Deferred())

    ipcMain.off(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_ENTER), this.onIPCMouseEnter)

    ipcMain.off(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_LEAVE), this.onIPCMouseLeave)

    try {
      this.window?.close()
      deferred.resolve()
    } catch (err) {
      log.error(`Unable to close window`, err)
      deferred.reject(err)
    }
    return deferred.promise
  }

  get config() {
    return this.config_
  }

  whenReady(): Promise<OverlayWindow> {
    return this.readyDeferred_.promise
  }

  get ready() {
    if (this.readyDeferred_.isRejected()) throw this.readyDeferred_.error ?? Error(`Failed to reach ready state`)

    return this.readyDeferred_.isSettled()
  }

  sendConfig() {
    log.info(`Sending overlay config`, this.config?.overlay?.id)
    this.window?.webContents?.send(OverlayClientEventTypeToIPCName(OverlayClientEventType.OVERLAY_CONFIG), this.config)
  }

  private constructor(overlay: OverlayInfo, placement: OverlayPlacement) {
    this.config_ = { overlay, placement }
    this.windowOptions = {
      ...windowOptionDefaults({
        devTools: isDev,
        transparent: true
      }),
      transparent: true,
      show: false,
      frame: false,
      backgroundColor: "#00000000",
      alwaysOnTop: true
    }

    this.window_ = new BrowserWindow(this.windowOptions)
    this.setIgnoreMouseEvents(true)

    ipcMain.on(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_ENTER), this.onIPCMouseEnter)

    ipcMain.on(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_LEAVE), this.onIPCMouseLeave)

    // The returned promise is tracked via `readyDeferred`
    this.initialize().catch(err => {
      log.error(`failed to initialize overlay window`, err)
    })
  }

  private async initialize(): Promise<OverlayWindow> {
    const deferred = this.readyDeferred_
    try {
      const win = this.window_
      const url = resolveHtmlPath("index-overlay.html")
      info(`Resolved overlay url: ${url}`)

      await win.loadURL(url)
      win.show()
      if (isDev) {
        win.webContents.openDevTools({
          mode: "detach"
        })
      }

      deferred.resolve(this)

      await deferred.promise
    } catch (err) {
      log.error(`Failed to initialize overlay window`, err)
      deferred.reject(err)
    }
    return deferred.promise
  }

  static create(overlay: OverlayInfo, placement: OverlayPlacement): OverlayWindow {
    return new OverlayWindow(overlay, placement)
  }

  private setIgnoreMouseEvents(ignore: boolean): void {
    if (ignore) {
      this.window_?.setIgnoreMouseEvents(true, {
        forward: true
      })
    } else {
      this.window_?.setIgnoreMouseEvents(false)
    }
  }
}

export interface OverlayManagerEventArgs {
  [OverlayManagerEventType.STATE_CHANGED]: (manager: OverlayManager, newState: OverlayManagerState) => void

  // [OverlayManagerEventType.CREATED]: (
  //   manager: OverlayManager,
  //   overlay: OverlayWindow
  // ) => void
  //
  // [OverlayManagerEventType.REMOVED]: (
  //   manager: OverlayManager,
  //   overlay: OverlayWindow
  // ) => void
  //
  // [OverlayManagerEventType.BOUNDS_CHANGED]: (
  //   manager: OverlayManager,
  //   overlay: OverlayWindow,
  //   bounds: Rectangle
  // ) => void
}

const DashboardTrackMapMockConfig: DashboardConfig = {
  id: "DefaultDashboardConfig",
  name: "DefaultDashboardConfig",
  description: "Default",
  screenId: "screen0", // TODO: implement or remove
  // screen: {
  //
  // },
  overlays: [
    {
      id: "track-map-0",
      kind: OverlayKind.TRACK_MAP,
      name: "track-map-0",
      description: "Default",
      dataVarNames: [
        "PlayerCarIdx",
        "CarIdxLap",
        "CarIdxLapCompleted",
        "CarIdxPosition",
        "CarIdxClassPosition",
        "CarIdxEstTime",
        "CarIdxLapDistPct"
      ]
    }
  ],
  placements: [
    {
      id: "track-map-placement-0",
      overlayId: "track-map-0",
      rect: {
        size: {
          width: 400,
          height: 400
        },
        position: {
          x: 0,
          y: 0
        }
      }
    }
  ]
}

export interface OverlayManagerState {
  configs: DashboardConfig[]
  
  activeSessionId: string

  overlays: OverlayWindow[]
}


@Singleton()
export class OverlayManager extends EventEmitter3<OverlayManagerEventArgs> {
  private persistQueue_ = new PQueue({
    concurrency: 1,
  })
  
  private state_: OverlayManagerState = null
  
  private validateState(state:OverlayManagerState) {
    // CREATE A DEFAULT CONFIG IF NONE EXIST
    if (isEmpty(state.configs)) {
      const defaultConfig = DashboardConfig.create({ ...DashboardTrackMapMockConfig, id: generateUUID() })
      this.saveDashboardConfig(defaultConfig)
          .catch(err => {
            error("Failed to save default config", err)
          })
      
      state.configs.push(defaultConfig)
    }
    
    const activeDashboardId = this.activeDashboardId
    if (!activeDashboardId || !state.configs.some(it => it.id === activeDashboardId)) {
      this.appSettingsService.changeSettings({
        activeDashboardId: state.configs[0].id
      })
    }
  }
  
  /**
   * Create the initial state for the overlay manager
   *
   * @private
   */
  private async createInitialState(): Promise<OverlayManagerState> {
    const dashFiles = await Fsx.promises
        .readdir(dashDir)
        .then(files => files.filter(endsWith(FileExtensions.Dashboard)).map(f => Path.join(dashDir, f)))
    
    const configs = asOption<DashboardConfig[]>(
        await Promise.all(
            dashFiles.map(file =>
                Fsx.readJSON(file)
                    .then(json => DashboardConfig.fromJson(json))
                    .catch(err => {
                      error(`Unable to read file ${file}`, err)
                      return null
                    })
            )
        )
    )
        .filter(isDefined)
        .getOrThrow()
    
    const state:OverlayManagerState =  {
      configs,
      activeSessionId: null,
      overlays: []
    }
    
    this.validateState(state)
    return state
  }
  
  
  get state() {
    return this.state_
  }

  get overlays() {
    return this.state.overlays ?? []
  }
  
  get activeDashboardId() {
    return this.appSettingsService.appSettings?.activeDashboardId
  }
  
  get activeDashboardConfig() {
    this.validateState(this.state)
    
    const {configs} = this.state
    const {activeDashboardId} = this
    
    return configs.find(it => it.id === activeDashboardId)
    
    
  }

  getOverlayByWindowId(windowId: number) {
    return this.overlays.find(overlay => overlay.windowId === windowId)
  }

  async closeAll(skipPatch = false): Promise<void> {
    await Promise.all(this.overlays.map(overlay => overlay.close()))

    if (!skipPatch) {
      this.patchState({
        overlays: []
      })
    }
  }

  private async updateActiveSession(activeSessionType: ActiveSessionType, activeSession: SessionDetail) {
    const currentActiveSessionId = this.state.activeSessionId,
      idChanged = currentActiveSessionId !== activeSession?.id,
      notActive = activeSessionType === "NONE"

    if (idChanged || notActive) {
      await this.closeAll(true)
    }

    if (!idChanged) return

    const overlays = Array<OverlayWindow>()
    if (!notActive) {
      const config = this.activeDashboardConfig
      const activePlayer = this.sessionManager.getActivePlayer()
      const overlayMap = config.overlays.filter(isDefined).reduce((map, overlayInfo) => {
        activePlayer.getDataVariables(...(overlayInfo.dataVarNames ?? []))
        return {
          ...map,
          [overlayInfo.id]: overlayInfo
        }
      }, {}) as { [id: string]: OverlayInfo }

      overlays.push(
        ...config.placements
          .map(placement => {
            const overlay = overlayMap[placement.overlayId]
            if (!overlay) {
              log.error("Unable to locate overlay with id", placement.overlayId)
              return null
            }

            const newWin = OverlayWindow.create(overlay, placement)
            newWin.window.on("closed", this.createOnCloseHandler(newWin.windowId))
            newWin.window.on("moved", this.createOnMoveHandler(newWin))
            return newWin
          })
          .filter(isDefined)
      )
    }

    this.patchState({
      activeSessionId: activeSession?.id,
      overlays
    })

    if (overlays.length) await Promise.all(overlays.map(overlay => overlay.whenReady()))

    this.broadcastRendererOverlays(PluginClientEventType.SESSION_INFO, activeSession?.id, activeSession?.info)
  }

  private async onActiveSessionChangedEvent(
    activeSessionType: ActiveSessionType,
    activeSession: SessionDetail,
    _newState: SessionManagerState
  ) {
    await this.updateActiveSession(activeSessionType, activeSession)
  }

  private onSessionStateChangedEvent(_newState: SessionManagerState) {
    this.broadcastRendererOverlays(PluginClientEventType.SESSION_INFO, this.sessionManager.activeSession?.info)
  }

  private onSessionDataFrameEvent(sessionId: string, dataVarValues: SessionDataVariableValueMap) {
    this.broadcastRendererOverlays(
      PluginClientEventType.DATA_FRAME,
      sessionId,
      this.sessionManager.activeSession?.timing,
      dataVarValues
    )
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Electron.Event) {
    debug(`Unloading OverlayManager`, event)
  }

  async fetchOverlayConfigHandler(event: IpcMainInvokeEvent): Promise<OverlayConfig> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.state.overlays.find(it => it.window?.id === windowId)

    return overlayWindow?.config
  }

  /**
   * Handles renderer invocations for session info
   *
   * @param event
   */
  async fetchSessionHandler(event: IpcMainInvokeEvent): Promise<OverlaySessionData> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id

    if (!this.isValidOverlayWindowId(windowId)) {
      error(`Unknown overlay window ${windowId}`)
      return {
        id: null,
        info: null,
        timing: null
      }
    }

    const session = this.sessionManager.activeSession

    return {
      id: session.id,
      info: session.info,
      timing: session.timing
    }
  }

  /**
   * ipcMain invoke handler for window close
   * @param event
   * @private
   */
  private async closeHandler(event: IpcMainInvokeEvent): Promise<void> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id

    return asOption(this.state.overlays.find(it => it.window?.id === windowId)).match({
      Some: overlayWindow => {
        return overlayWindow.close()
      },
      None: () => {
        log.warn(`Unable to find overlay window with id: ${windowId}`)
        return Deferred.resolve<void>().promise
      }
    })
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    this.state_ = await this.createInitialState()

    const ipcFnHandlers = Array<Pair<OverlayClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
      [OverlayClientFnType.FETCH_CONFIG, this.fetchOverlayConfigHandler.bind(this)],
      [OverlayClientFnType.FETCH_SESSION, this.fetchSessionHandler.bind(this)],
      [OverlayClientFnType.CLOSE, this.closeHandler.bind(this)]
    )

    app.on("before-quit", this.unload)

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayClientFnTypeToIPCName(type), handler))

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })

      if (module.hot) {
        module.hot.addDisposeHandler(() => {
          app.off("before-quit", this.unload)
          ipcFnHandlers.forEach(([type]) => ipcMain.removeHandler(OverlayClientFnTypeToIPCName(type)))

          Object.assign(global, {
            overlayManager: undefined
          })
        })
      }
    }

    const { sessionManager } = this
    sessionManager.on(SessionManagerEventType.ACTIVE_SESSION_CHANGED, this.onActiveSessionChangedEvent.bind(this))
    sessionManager.on(SessionManagerEventType.STATE_CHANGED, this.onSessionStateChangedEvent.bind(this))
    sessionManager.on(SessionManagerEventType.DATA_FRAME, this.onSessionDataFrameEvent.bind(this))
  }

  /**
   * Service constructor
   *
   * @param container
   * @param sessionManager
   * @param appSettingsService
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService
  ) {
    super()
  }

  @Bind
  private saveDashboardConfig(config: DashboardConfig) {
    return this.persistQueue_.add(this.createSaveDashboardConfigTask(config))
  }
  
  @Bind
  private deleteDashboardConfig(config: DashboardConfig) {
    return this.persistQueue_.add(this.createDeleteDashboardConfigTask(config.id))
  }
  
  /**
   * Merge & patch OverlayManagerState slice
   */

  private patchState(newStateOrFn: Partial<OverlayManagerState> | OverlayManagerStatePatchFn = {}): OverlayManagerState {
    const currentState = this.state_
    const currentConfigs = currentState.configs ?? []
    
    const newStatePatch = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn
    
    const newState = assign(this.state_, newStatePatch)
    const newConfigs = newState.configs ?? []
    
    // HANDLE REMOVALS
    const missingConfigs = currentConfigs.filter(({id}) => !newConfigs.some(({id: newId}) => newId === id))
    missingConfigs.forEach(this.deleteDashboardConfig)
    
    // HANDLE ADDITIONS
    const diffConfigs = newConfigs.filter((newConfig, i) => !isEqual(currentConfigs[i], newConfig))
    diffConfigs.forEach(this.saveDashboardConfig)
    
    this.broadcastMainStateChanged(newState)
    return newState
  }

  /**
   * Broadcast a state change
   *
   * @private
   */
  private broadcastMainStateChanged(state: OverlayManagerState = this.state_) {
    this.broadcastMain(OverlayManagerEventType.STATE_CHANGED, state)
  }

  /**
   * Generate broadcast/emit function.  This emits via it's super
   * class `EventEmitter3` & sends it to all browser windows
   *
   * @param type
   * @param args
   * @private
   */
  private broadcastMain(type: OverlayManagerEventType, ...args: any[]): void {
    ;(this.emit as any)(type, ...args)
  }

  private broadcastRendererOverlays(type: OverlayClientEventType | PluginClientEventType, ...args: any[]): void {
    const ipcEventName = OverlayClientEventTypeToIPCName(type)
    this.overlays.forEach(overlay => {
      if (overlay.ready) overlay.window?.webContents?.send(ipcEventName, ...args)
    })
  }

  private isValidOverlayWindowId(windowId: number): boolean {
    return this.state.overlays.some(it => it.window?.id === windowId)
  }

  private createOnCloseHandler(windowId: number): Function {
    return (event: Electron.Event) => {
      this.patchState(state => ({
        overlays: state.overlays.filter(overlay => overlay.windowId !== windowId)
      }))
      // event.returnValue = true
    }
  }

  private createOnMoveHandler(newWin: OverlayWindow): Function {
    return (event: Electron.Event) => {
      newWin.window.getBounds()
    }
  }
  
  private createDeleteDashboardConfigTask(id: string) {
    return async () => {
      const dashFile = Path.join(AppPaths.dashboardsDir, id + FileExtensions.Dashboard)
      info(`Deleting dashboard ${dashFile}`)
      
      await Fsx.unlink(dashFile)
    }
    
  }
  
  private createSaveDashboardConfigTask(config: DashboardConfig) {
    return async () => {
      const dashFile = Path.join(AppPaths.dashboardsDir, config.id + FileExtensions.Dashboard)
      info(`Saving dashboard ${dashFile}`)
      
      await Fsx.writeJSON(dashFile, DashboardConfig.toJson(config))
    }
    
  }
  
  
}

export default OverlayManager
