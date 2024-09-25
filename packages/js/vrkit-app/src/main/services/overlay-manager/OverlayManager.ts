import { getLogger } from "@3fv/logger-proxy"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, NativeImage } from "electron"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import {
  OverlayConfig,
  DashboardConfig,
  OverlayInfo,
  OverlayPlacement,
  RectI,
  SessionDataVariableValueMap,
  VRLayout
} from "vrkit-models"
import { isDefined, isFunction } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import {
  assign,
  defaults,
  Disposables,
  hasProps,
  isDev,
  isEmpty,
  isEqual,
  isRectValid,
  Pair,
  SignalFlag
} from "vrkit-app-common/utils"
import { Deferred } from "@3fv/deferred"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  
  OverlayManagerEventType,
  OverlayManagerState,
  OverlayManagerStatePatchFn,
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
import { OverlayWindow } from "./OverlayWindow"
import { MainWindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { pick } from "lodash"
import { NativeImageSequenceCapture } from "../../utils"
import { CreateNativeOverlayManager } from "vrkit-native-interop"
import type { IArrayDidChange, IMapDidChange, IObjectDidChange } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"

type IChange = IObjectDidChange | IArrayDidChange | IMapDidChange
// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

export interface OverlayManagerEventArgs {
  [OverlayManagerEventType.STATE_CHANGED]: (manager: OverlayManager, newState: OverlayManagerState) => void
}

@Singleton()
export class OverlayManager extends EventEmitter3<OverlayManagerEventArgs> {
  private overlays_: OverlayWindow[] = []

  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  // private state_: OverlayManagerState = null

  private readonly disposers_ = new Disposables()

  private stopObserving: IDisposer = null

  private readonly shutdownFlag_ = SignalFlag.new()

  private readonly frameSequenceCaptures_ = Array<NativeImageSequenceCapture>()

  private readonly nativeManager_ = CreateNativeOverlayManager()

  get state() {
    return this.mainAppState.overlayManager
  }

  get isShutdown() {
    return this.shutdownFlag_.isSet
  }

  get mode() {
    return this.mainAppState.overlayMode
  }

  get overlays() {
    return this.overlays_ ?? []
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

    
  }
  
  private checkActiveDashboardConfig() {
    const state = this.state
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
      activeSessionId: null
    }

    this.validateState(state)
    return state
  }

  getOverlayByWindowId(windowId: number) {
    return this.overlays.find(overlay => overlay.windowId === windowId)
  }

  async closeAll(skipPatch = false): Promise<void> {
    await Promise.all(this.overlays.map(overlay => overlay.close()))
    this.overlays_ = []

    if (!skipPatch) {
      this.patchState({})
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

            const newWin = OverlayWindow.create(this, overlay, placement)

            const onBoundsChanged = this.createOnBoundsChangedHandler(config, placement, newWin)
            newWin.window
              .on("closed", this.createOnCloseHandler(newWin.windowId))
              .on("moved", onBoundsChanged)
              .on("resized", onBoundsChanged)

            newWin.window.webContents.setFrameRate(overlay.settings?.fps ?? 10)
            newWin.window.webContents.beginFrameSubscription(
              false,
              this.createOnFrameHandler(config, placement, newWin)
            )
            //on("paint",this.createOnPaintHandler(config, placement, newWin))
            return newWin
          })
          .filter(isDefined)
      )
    }

    this.overlays_ = overlays
    this.patchState({
      activeSessionId: activeSession?.id
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

  async fetchOverlayConfigHandler(event: IpcMainInvokeEvent): Promise<OverlayConfig> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.overlays.find(it => it.window?.id === windowId)

    return asOption(overlayWindow?.config)
        .map(config => OverlayConfig.toJson(config))
        .getOrNull() as OverlayConfig
  }

  async fetchDashboardConfigsHandler(event: IpcMainInvokeEvent): Promise<DashboardConfig[]> {
    return this.state.configs.map(it => DashboardConfig.toJson(it) as any)
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

    return asOption(this.overlays.find(it => it.window?.id === windowId)).match({
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
   * @param _event
   */
  async fetchOverlayModeHandler(_event: IpcMainInvokeEvent) {
    return this.mode
  }

  /**
   * Set overlay mode
   *
   * @param mode
   */
  setOverlayMode(mode: OverlayMode) {
    if (mode === this.mode) {
      log.debug(`mode is unchanged`, mode, this.mode)
      return mode
    }

    for (const ow of this.overlays) {
      ow.setMode(mode)
    }

    this.mainAppState.setOverlayMode(mode)

    return mode
  }

  /**
   * Set the overlay mode
   *
   * @param event
   * @param mode
   */
  async setOverlayModeHandler(event: IpcMainInvokeEvent, mode: OverlayMode): Promise<OverlayMode> {
    return this.setOverlayMode(mode)
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private async unload(event: Electron.Event = null) {
    debug(`Unloading OverlayManager`, event)

    this.disposers_.dispose()

    const overlays = this.overlays ?? []

    await Promise.all(
      overlays.map(o => {
        o.window?.webContents?.endFrameSubscription()
        return o.close()
      })
    )
      .then(() => info(`All windows closed`))
      .catch(err => warn(`error closing windows`, err))

    this.overlays_ = []
  }

  @Bind
  private onStateChanged(change: IChange, path: string, root: OverlayManagerState) {
    info(`Received mobx state change (${path})`, change)
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    this.mainAppState.setOverlayManagerState(await this.createInitialState())
    this.checkActiveDashboardConfig()
    
    app.on("before-quit", this.unload)

    const { sessionManager } = this,
      ipcFnHandlers = Array<Pair<OverlayClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
        [OverlayClientFnType.FETCH_DASHBOARD_CONFIGS, this.fetchDashboardConfigsHandler.bind(this)],
        [OverlayClientFnType.FETCH_CONFIG, this.fetchOverlayConfigHandler.bind(this)],
        [OverlayClientFnType.FETCH_SESSION, this.fetchSessionHandler.bind(this)],
        [OverlayClientFnType.SET_OVERLAY_MODE, this.setOverlayModeHandler.bind(this)],
        [OverlayClientFnType.FETCH_OVERLAY_MODE, this.fetchOverlayModeHandler.bind(this)],
        [OverlayClientFnType.CLOSE, this.closeHandler.bind(this)]
      ),
      sessionManagerEventHandlers = Array<Pair<SessionManagerEventType, (...args: any[]) => void>>(
        [SessionManagerEventType.ACTIVE_SESSION_CHANGED, this.onActiveSessionChangedEvent.bind(this)],
        [SessionManagerEventType.STATE_CHANGED, this.onSessionStateChangedEvent.bind(this)],
        [SessionManagerEventType.DATA_FRAME, this.onSessionDataFrameEvent.bind(this)]
      )

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayClientFnTypeToIPCName(type), handler))

    this.stopObserving = deepObserve(this.mainAppState.overlayManager, this.onStateChanged)
    
    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })
    }

    this.disposers_.push(() => {
      if (this.stopObserving) {
        this.stopObserving()
      }
      ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(OverlayClientFnTypeToIPCName(type)))
      sessionManagerEventHandlers.forEach(([type, handler]) => sessionManager.off(type, handler))
      app.off("before-quit", this.unload)

      Object.assign(global, {
        overlayManager: undefined
      })
    })

    if (module.hot) {
      module.hot.addDisposeHandler(() => {
        this.unload()
      })
    }

    sessionManagerEventHandlers.forEach(([type, handler]) => sessionManager.on(type, handler))
  }

  /**
   * Service constructor
   *
   * @param container
   * @param sessionManager
   * @param appSettingsService
   * @param mainWindowManager
   * @param mainAppState
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: MainWindowManager,
    readonly mainAppState: MainSharedAppState
  ) {
    super()
  }

  /**
   * Save a dashboard config
   *
   * @param config
   * @returns {Promise<void>} pending task promise scheduled in `p-queue`
   */
  @Bind
  private saveDashboardConfig(config: DashboardConfig): Promise<void> {
    return this.persistQueue_.add(this.createSaveDashboardConfigTask(config))
  }

  /**
   * Delete a dashboard config
   *
   * @param config
   * @returns {Promise<void>} pending task promise scheduled in `p-queue`
   */
  @Bind
  private deleteDashboardConfig(config: DashboardConfig): Promise<void> {
    return this.persistQueue_.add(this.createDeleteDashboardConfigTask(config.id))
  }

  /**
   * Merge & patch OverlayManagerState slice
   */

  private patchState(
    newStateOrFn: Partial<OverlayManagerState> | OverlayManagerStatePatchFn = {},
    skipBroadcast: boolean = false
  ): OverlayManagerState {
    const currentState = this.state
    const currentConfigs = currentState.configs ?? []

    const newStatePatch = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn

    const newState = defaults({ ...this.state, ...newStatePatch }, { configs: [] }),
      newConfigs = newState.configs

    this.mainAppState.updateOverlayManager(newState)

    // HANDLE REMOVALS
    const missingConfigs = currentConfigs.filter(({ id }) => !newConfigs.some(({ id: newId }) => newId === id))
    missingConfigs.forEach(this.deleteDashboardConfig)

    // HANDLE ADDITIONS
    const diffConfigs = newConfigs.filter((newConfig, i) => !isEqual(currentConfigs[i], newConfig))
    diffConfigs.forEach(this.saveDashboardConfig)

    if (!skipBroadcast) this.broadcastMainStateChanged(newState)

    return newState
  }

  /**
   * Broadcast a state change
   *
   * @private
   */
  private broadcastMainStateChanged(state: OverlayManagerState = this.state) {
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

  /**
   * Broadcast to overlay windows
   *
   * @param type
   * @param args
   * @private
   */
  private broadcastRendererOverlays(type: OverlayClientEventType | PluginClientEventType, ...args: any[]): void {
    const ipcEventName = OverlayClientEventTypeToIPCName(type)
    this.overlays.forEach(overlay => {
      if (overlay.ready) overlay.window?.webContents?.send(ipcEventName, ...args)
    })
  }

  /**
   * Broadcast an event to the main window
   *
   * @param type
   * @param args
   * @private
   */
  private broadcastRendererMainWindow(type: OverlayClientEventType | PluginClientEventType, ...args: any[]): void {
    const ipcEventName = OverlayClientEventTypeToIPCName(type)
    this.mainWindowManager.mainWindow?.webContents?.send(ipcEventName, ...args)
  }

  /**
   * Check if `windowId` is valid
   *
   * @param windowId
   * @private
   */
  private isValidOverlayWindowId(windowId: number): boolean {
    return this.overlays.some(it => it.window?.id === windowId)
  }

  /**
   * Create on window close handler
   * @param windowId
   * @private
   */
  private createOnCloseHandler(windowId: number): Function {
    return (event: Electron.Event) => {
      this.overlays_ = this.overlays.filter(overlay => overlay.windowId !== windowId)
      this.patchState(state => ({}))
    }
  }

  /**
   * On paint handler (not used at the moment, but if render model is changed,
   * it may)
   * @param config
   * @param targetPlacement
   * @param win
   * @private
   */
  private createOnPaintHandler(config: DashboardConfig, targetPlacement: OverlayPlacement, win: OverlayWindow) {
    let cap: NativeImageSequenceCapture = asOption(this.mainAppState.devSettings?.imageSequenceCapture)
      .filter(it => it !== false)
      .map(
        ({ format, outputPath }) => new NativeImageSequenceCapture(win.config.overlay.id + "-paint", format, outputPath)
      )
      .getOrNull()

    return (_ev: Electron.Event, dirty: Electron.Rectangle, image: NativeImage) => {
      if (cap) cap.push(image)
    }
  }

  private createOnFrameHandler(config: DashboardConfig, targetPlacement: OverlayPlacement, win: OverlayWindow) {
    let cap: NativeImageSequenceCapture = asOption(this.mainAppState.devSettings?.imageSequenceCapture)
      .filter(it => it !== false)
      .map(
        ({ format, outputPath }) => new NativeImageSequenceCapture(win.config.overlay.id + "-frame", format, outputPath)
      )
      .getOrNull()

    return (image: NativeImage, dirty: Electron.Rectangle) => {
      const buf = image.getBitmap(),
          screenRect = this.getOverlayScreenRect(win),
          vrLayout = this.getOverlayVRLayout(win)
      // TODO: Get real screen & VR rectangles
      // const win = this.overlays.find(it => it.id === config.id)
      this.nativeManager_.createOrUpdateResources(
        win.id,
        win.windowId,
        { width: dirty.width, height: dirty.height },
        screenRect,
        vrLayout
      )
      this.nativeManager_.processFrame(win.id, buf)
      if (cap) cap.push(image)
    }
  }

  /**
   * Create a bounds changed (`moved`, `resized`) event handler
   *
   * @param config
   * @param targetPlacement
   * @param win
   * @private
   */
  private createOnBoundsChangedHandler(
    config: DashboardConfig,
    targetPlacement: OverlayPlacement,
    win: OverlayWindow
  ): Function {
    return (event: Electron.Event) => {
      this.updateOverlayWindowBounds(win)
    }
  }

  /**
   * Create a delete dashboard config task
   *
   * @param id
   * @private
   */
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

  updateOverlayPlacement(
    win: OverlayWindow,
    mutator: (placement: OverlayPlacement, dashboardConfig: DashboardConfig) => OverlayPlacement
  ): OverlayPlacement {
    return asOption(this.activeDashboardConfig)
      .map(config =>
        asOption(config.placements.find(p => p.overlayId === win.id)).match({
          None: () => {
            error(`Unable to find placement ${win.id} in config`, config)
            return null
          },
          Some: placement => {
            const newPlacement = mutator(placement, config)
            if (newPlacement !== placement && !isEqual(placement, newPlacement)) {
              assign(placement, { ...newPlacement })
            }

            this.saveDashboardConfig(config)
              .then(() => info(`Saved updated dashboard config`, config))
              .catch(err => {
                error(`failed to save config`, config)
              })

            return placement
          }
        })
      )
      .getOrNull()
  }

  updateOverlayWindowBounds(win: OverlayWindow): RectI {
    let screenRect: RectI = null
    this.updateOverlayPlacement(win, (placement, _dashboardConfig) => {
      const bounds = win.window.getBounds(),
        rect = RectI.create({
          size: pick(bounds, "width", "height"),
          position: pick(bounds, "x", "y")
        })

      screenRect = placement.screenRect = rect
      debug(`Saving updated dashboard config updated rect`, rect)
      return placement
    })

    return RectI.toJson(screenRect) as RectI
  }

  getOverlayScreenRect(win: OverlayWindow): RectI {
    return asOption(win.placement?.screenRect)
      .filter(isDefined)
      .filter(isRectValid)
        .map(screenRect => RectI.toJson(screenRect) as RectI)
      .getOrCall(() => this.updateOverlayWindowBounds(win))
  }

  getOverlayVRLayout(win: OverlayWindow): VRLayout {
    return asOption(win.placement?.vrLayout)
      .filter(isDefined)
      .filter(hasProps("size", "pose"))
      .map(vrLayout => VRLayout.toJson(vrLayout))
      .getOrCall(() => {
        return {
          pose: {
            x: -0.25,
            eyeY: 0.0,
            z: -1.0
          },
          size: { width: 0.5, height: 0.5 }
        }
      }) as VRLayout
  }
}

export default OverlayManager
