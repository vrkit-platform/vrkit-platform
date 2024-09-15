import { getLogger } from "@3fv/logger-proxy"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, screen } from "electron"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { DashboardConfig, OverlayInfo, SessionDataVariableValueMap } from "vrkit-models"
import { isDefined, isFunction } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import { assign, isDev, isEmpty, isEqual, Pair } from "vrkit-app-common/utils"
import { Deferred } from "@3fv/deferred"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  OverlayConfig,
  OverlayManagerEventType,
  OverlayMode,
  OverlaySessionData,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents
} from "vrkit-app-common/models/overlay-manager"
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
import PQueue from "p-queue"
import { newDashboardTrackMapMockConfig } from "./DefaultDashboardConfig"
import ioHook from "iohook-raub"
import { THookEventMouse } from "vrkit-shared"
import { OverlayWindow } from "./OverlayWindow"
// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

export type OverlayManagerStatePatchFn = (state: OverlayManagerState) => Partial<OverlayManagerState>

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

export interface OverlayManagerState {
  configs: DashboardConfig[]

  activeSessionId: string

  overlays: OverlayWindow[]

  mode: OverlayMode
}

@Singleton()
export class OverlayManager extends EventEmitter3<OverlayManagerEventArgs> {
  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  private state_: OverlayManagerState = null

  get state() {
    return this.state_
  }

  get mode() {
    return this.state.mode
  }

  get overlays() {
    return this.state.overlays ?? []
  }

  get activeDashboardId() {
    return this.appSettingsService.appSettings?.activeDashboardId
  }

  get activeDashboardConfig() {
    this.validateState(this.state)

    const { configs } = this.state
    const { activeDashboardId } = this

    return configs.find(it => it.id === activeDashboardId)
  }

  private validateState(state: OverlayManagerState) {
    // CREATE A DEFAULT CONFIG IF NONE EXIST
    if (isEmpty(state.configs)) {
      const defaultConfig = DashboardConfig.create(newDashboardTrackMapMockConfig())
      this.saveDashboardConfig(defaultConfig).catch(err => {
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

    const state: OverlayManagerState = {
      configs,
      activeSessionId: null,
      overlays: [],
      mode: OverlayMode.NORMAL
    }

    this.validateState(state)
    return state
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
            newWin.window.on("will-move", () => {
              log.info(`will move!!!`)
            })
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
    const activeSession = this.sessionManager.activeSession
    this.broadcastRendererOverlays(PluginClientEventType.SESSION_INFO, activeSession?.id, activeSession?.info)
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

    ioHook.stop()
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
   * Get the current overlay mode for the app
   *
   * @param event
   */
  async fetchOverlayModeHandler(event: IpcMainInvokeEvent) {
    return this.mode
  }
  
  /**
   * Set the overlay mode
   *
   * @param event
   * @param mode
   */
  async setOverlayModeHandler(event: IpcMainInvokeEvent, mode: OverlayMode): Promise<OverlayMode> {
    if (mode === this.mode) {
      log.debug(`mode is unchanged`, mode, this.mode)
      return mode
    }

    mode = this.patchState({
      mode
    }).mode

    this.broadcastRendererOverlays(OverlayClientEventType.OVERLAY_MODE, mode)

    return mode
  }

  @Bind
  private onIOHookMouseMove(ev: THookEventMouse) {
    //log.info("IOHook mouse move", ev) // { type: 'mousemove', x: 700, y: 400 }
    const p = screen.screenToDipPoint({
      x: ev.x,
      y: ev.y
    })
    for (let ow of this.overlays) {
      const bounds = ow.window.getBounds()
      const { x, y, width, height } = bounds
      if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height) {
        // log.info(`Enable event`, ev, "point", p, "window bounds", bounds)
        ow.setFocused(true)
      } else {
        ow.setFocused(false)
      }
    }
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
      [OverlayClientFnType.SET_OVERLAY_MODE, this.setOverlayModeHandler.bind(this)],
      [OverlayClientFnType.FETCH_OVERLAY_MODE, this.fetchOverlayModeHandler.bind(this)],
      [OverlayClientFnType.CLOSE, this.closeHandler.bind(this)]
    )

    app.on("before-quit", this.unload)
    ioHook.on("mousemove", this.onIOHookMouseMove)
    ioHook.start()
    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayClientFnTypeToIPCName(type), handler))

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })

      if (module.hot) {
        module.hot.addDisposeHandler(() => {
          app.off("before-quit", this.unload)
          ioHook.off("mousemove", this.onIOHookMouseMove)
          ioHook.stop()

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

  private patchState(
    newStateOrFn: Partial<OverlayManagerState> | OverlayManagerStatePatchFn = {}
  ): OverlayManagerState {
    const currentState = this.state_
    const currentConfigs = currentState.configs ?? []

    const newStatePatch = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn

    const newState = assign(this.state_, newStatePatch)
    const newConfigs = newState.configs ?? []

    // HANDLE REMOVALS
    const missingConfigs = currentConfigs.filter(({ id }) => !newConfigs.some(({ id: newId }) => newId === id))
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
