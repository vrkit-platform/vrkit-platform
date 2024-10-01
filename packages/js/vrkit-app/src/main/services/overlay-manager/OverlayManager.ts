import { getLogger } from "@3fv/logger-proxy"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, NativeImage } from "electron"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import {
  DashboardConfig,
  OverlayInfo,
  OverlayKind,
  OverlayPlacement,
  RectI,
  SessionDataVariableValueMap,
  VRLayout
} from "vrkit-models"
import { isDefined, isFunction, isNumber } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import { assign, Disposables, hasProps, isDev, isEqual, isRectValid, Pair, SignalFlag } from "vrkit-app-common/utils"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  OverlayManagerEventType,
  OverlayMode,
  OverlaysState,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents
} from "../../../common/models/overlays"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import { ActiveSessionType, SessionDetail, SessionManagerEventType } from "../../../common/models/sessions"
import { PluginClientEventType } from "vrkit-plugin-sdk"
import { AppPaths, FileExtensions } from "vrkit-app-common/constants"
import { AppSettingsService } from "../app-settings"
import Fsx from "fs-extra"
import Path from "path"
import PQueue from "p-queue"
import {
  OverlayBrowserWindow, OverlayBrowserWindowKind
} from "./OverlayBrowserWindow"
import { MainWindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { flatten, pick } from "lodash"
import { NativeImageSequenceCapture } from "../../utils"
import { CreateNativeOverlayManager } from "vrkit-native-interop"

import { IValueDidChange, observe, toJS } from "mobx"
import { IDisposer } from "mobx-utils"
import { DashboardManager } from "../dashboard-manager"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

export interface OverlayManagerEventArgs {
  [OverlayManagerEventType.STATE_CHANGED]: (manager: OverlayManager, newState: OverlaysState) => void
}


@Singleton()
export class OverlayManager extends EventEmitter3<OverlayManagerEventArgs> {
  private overlays_: OverlayBrowserWindow[] = []

  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  // private state_: OverlayManagerState = null

  private readonly disposers_ = new Disposables()

  private stopObservingCallbacks = Array<IDisposer>()

  private readonly shutdownFlag_ = SignalFlag.new()

  private readonly frameSequenceCaptures_ = Array<NativeImageSequenceCapture>()

  private readonly nativeManager_ = CreateNativeOverlayManager()

  get state() {
    return this.mainAppState.overlays
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
    return this.dashManager.activeDashboardId
  }

  get activeDashboardConfig(): DashboardConfig {
    return this.dashManager.activeDashboardConfig
  }

  /**
   * Create the initial state for the overlay manager
   *
   * @private
   */
  private async createInitialState(): Promise<OverlaysState> {
    return {
      overlayMode: OverlayMode.NORMAL
    }
  }

  getOverlayByWindowId(windowId: number) {
    return this.overlays.find(overlay => overlay.windowId === windowId)
  }

  async closeAllOverlays(): Promise<void> {
    await Promise.all(this.overlays.map(overlay => overlay.close()))
    this.overlays_ = []
  }
  
  overlayWindowByUniqueId(uniqueid: string): OverlayBrowserWindow
  overlayWindowByUniqueId(id: string, kind: OverlayBrowserWindowKind): OverlayBrowserWindow
  overlayWindowByUniqueId(id: string, kind?: OverlayBrowserWindowKind): OverlayBrowserWindow {
    
    if(isNumber(kind)) {
      id = overlayInfoToComponentId(id, kind)
    }
  }
  
  private createOrUpdateOverlayBrowserWindow():OverlayBrowserWindow {
    let overlayWindow = this.overlayWindowByUniqueId
  }
  
  @Bind
  async onActiveDashboardConfigIdChanged(change: IValueDidChange<string>) {
    const config = this.activeDashboardConfig
    await this.closeAllOverlays()
    if (!config) {
      log.warn("No dashboard config provided to open, closed all")
      return
    }
    const overlays = Array<OverlayBrowserWindow>()

    const activePlayer = this.sessionManager.getActivePlayer()
    const overlayMap = config.overlays.filter(isDefined<OverlayInfo>).reduce((map, overlayInfo) => {
      // activePlayer.getDataVariables(...(overlayInfo.dataVarNames ?? []))
      this.sessionManager.registerComponentDataVars(overlayInfoToComponentId(overlayInfo), overlayInfo.dataVarNames)
      return {
        ...map,
        [overlayInfo.id]: overlayInfo
      }
    }, {}) as { [id: string]: OverlayInfo }

    overlays.push(
      ...flatten(config.placements
        .map(placement => {
          const overlay = overlayMap[placement.overlayId]
          if (!overlay) {
            log.error("Unable to locate overlay with id", placement.overlayId)
            return null
          }
          
          const overlayWindows = Array<OverlayBrowserWindow>()
          
          if (config.screenEnabled) {
            const newWin = OverlayBrowserWindow.create(this, OverlayBrowserWindowKind.SCREEN, overlay, placement)
            
            const onBoundsChanged = this.createOnBoundsChangedHandler(
                config,
                placement,
                newWin
            )
            newWin.window
                .on(
                    "closed",
                    this.createOnCloseHandler(
                        overlayInfoToComponentId(overlay),
                        newWin.windowId
                    )
                )
                .on("moved", onBoundsChanged)
                .on("resized", onBoundsChanged)
            
            newWin.window.webContents.setFrameRate(overlay.settings?.fps ?? 10)
            newWin.window.webContents.beginFrameSubscription(
                false,
                this.createOnFrameHandler(config, placement, newWin)
            )
            overlayWindows.push(newWin)
          }
          
          if (config.vrEnabled) {
            const newWin = OverlayBrowserWindow.create(this, OverlayBrowserWindowKind.VR, overlay, placement)
            
            const onBoundsChanged = this.createOnBoundsChangedHandler(
                config,
                placement,
                newWin
            )
            newWin.window
                .on(
                    "closed",
                    this.createOnCloseHandler(
                        overlayInfoToComponentId(overlay),
                        newWin.windowId
                    )
                )
                .on("moved", onBoundsChanged)
                .on("resized", onBoundsChanged)
            
            newWin.window.webContents.setFrameRate(overlay.settings?.fps ?? 10)
            newWin.window.webContents.on(
                "paint",
                this.createOnPaintHandler(config, placement, newWin)
            )
            overlayWindows.push(newWin)
          }
          
          return overlayWindows
        })
        .filter(isDefined))
    )

    this.overlays_ = overlays

    if (overlays.length) await Promise.all(overlays.map(overlay => overlay.whenReady()))
  }

  private async updateActiveSession(
    activeSessionId: string,
    activeSessionType: ActiveSessionType,
    activeSession: SessionDetail,
    oldActiveSessionId: string
  ) {
    const idChanged = activeSessionId !== oldActiveSessionId,
      notActive = activeSessionType === "NONE"

    if (!idChanged) {
      log.warn(`ID did not change (${activeSessionId}), no changes will be made to overlays`)
      return
    }

    // this.broadcastRendererOverlays(PluginClientEventType.SESSION_INFO, activeSession?.id, toJS(activeSession?.info))
  }

  private onSessionDataFrameEvent(sessionId: string, dataVarValues: SessionDataVariableValueMap) {
    this.broadcastRendererOverlays(
      PluginClientEventType.DATA_FRAME,
      sessionId,
      this.sessionManager.activeSession?.timing,
      dataVarValues
    )
  }

  async fetchOverlayConfigIdHandler(event: IpcMainInvokeEvent): Promise<string> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.overlays.find(it => it.window?.id === windowId)

    return overlayWindow?.config?.overlay?.id
  }

  /**
   * ipcMain invoke handler for window close
   * @param event
   * @private
   */
  private async closeHandler(event: IpcMainInvokeEvent): Promise<void> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.overlays.find(it => it.window?.id === windowId)

    if (overlayWindow) await overlayWindow.close()
    else log.warn(`Unable to find overlay window with id: ${windowId}`)
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

    this.mainAppState.setOverlayMode(mode)

    for (const ow of this.overlays) {
      ow.setMode(mode)
    }

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
  private onActiveSessionIdChanged(change: IValueDidChange<string>) {
    info(`Active session id changed from (${change.oldValue}) to (${change.newValue}) `, change)
    const { activeSessionId, activeSessionType, activeSession } = this.sessionManager
    this.updateActiveSession(activeSessionId, activeSessionType, activeSession, change.oldValue)
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    this.mainAppState.setOverlays(await this.createInitialState())

    app.on("before-quit", this.unload)

    const { sessionManager } = this,
      ipcFnHandlers = Array<Pair<OverlayClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
        [OverlayClientFnType.FETCH_CONFIG_ID, this.fetchOverlayConfigIdHandler.bind(this)],
        [OverlayClientFnType.SET_OVERLAY_MODE, this.setOverlayModeHandler.bind(this)],
        [OverlayClientFnType.CLOSE, this.closeHandler.bind(this)]
      ),
      sessionManagerEventHandlers = Array<Pair<SessionManagerEventType, (...args: any[]) => void>>([
        SessionManagerEventType.DATA_FRAME,
        this.onSessionDataFrameEvent.bind(this)
      ])

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayClientFnTypeToIPCName(type), handler))

    this.stopObservingCallbacks.push(
      observe(this.mainAppState.sessions, "activeSessionId", this.onActiveSessionIdChanged)
    )

    this.stopObservingCallbacks.push(
      observe(this.mainAppState.dashboards, "activeConfigId", this.onActiveDashboardConfigIdChanged)
    )
    // this.stopObserving = deepObserve(this.mainAppState.sessions, "activeSessionId", this.onActiveSessionIdChanged)

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })
    }

    this.disposers_.push(() => {
      this.stopObservingCallbacks.filter(isFunction).forEach(fn => fn())

      ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(OverlayClientFnTypeToIPCName(type)))
      sessionManagerEventHandlers.forEach(([type, handler]) => sessionManager.off(type, handler))
      app.off("before-quit", this.unload)

      Object.assign(global, {
        overlayManager: undefined
      })
    })

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
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
   * @param dashManager
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: MainWindowManager,
    readonly mainAppState: MainSharedAppState,
    readonly dashManager: DashboardManager
  ) {
    super()
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
    const jsArgs = args.map(arg => toJS(arg))
    this.overlays.forEach(overlay => {
      if (overlay.ready) overlay.window?.webContents?.send(ipcEventName, ...jsArgs)
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
   * @param overlayComponentId
   * @param windowId
   * @private
   */
  private createOnCloseHandler(overlayComponentId: string, windowId: number): Function {
    return (event: Electron.Event) => {
      this.sessionManager.unregisterComponentDataVars(overlayComponentId)
      this.overlays_ = this.overlays.filter(overlay => overlay.windowId !== windowId)
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
  private createOnPaintHandler(config: DashboardConfig, targetPlacement: OverlayPlacement, win: OverlayBrowserWindow) {
    let cap: NativeImageSequenceCapture = asOption(this.mainAppState.devSettings?.imageSequenceCapture)
      .filter(it => it !== false)
      .map(
        ({ format, outputPath }) => new NativeImageSequenceCapture(win.config.overlay.id + "-paint", format, outputPath)
      )
      .getOrNull()

    return (_ev: Electron.Event, dirty: Electron.Rectangle, image: NativeImage) => {
      const buf = image.getBitmap(),
          vrLayout = this.getOverlayVRLayout(win),
          screenRect = vrLayout.screenRect
      
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

  private createOnFrameHandler(config: DashboardConfig, targetPlacement: OverlayPlacement, win: OverlayBrowserWindow) {
    let cap: NativeImageSequenceCapture = asOption(this.mainAppState.devSettings?.imageSequenceCapture)
      .filter(it => it !== false)
      .map(
        ({ format, outputPath }) => new NativeImageSequenceCapture(win.config.overlay.id + "-frame", format, outputPath)
      )
      .getOrNull()

    return (image: NativeImage, dirty: Electron.Rectangle) => {
      // const buf = image.getBitmap(),
      //   screenRect = this.getOverlayScreenRect(win)
      //   // vrLayout = this.getOverlayVRLayout(win)
      // // TODO: Get real screen & VR rectangles
      // // const win = this.overlays.find(it => it.id === config.id)
      // this.nativeManager_.createOrUpdateResources(
      //   win.id,
      //   win.windowId,
      //   { width: dirty.width, height: dirty.height },
      //   screenRect,
      //   vrLayout
      // )
      // this.nativeManager_.processFrame(win.id, buf)
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
    win: OverlayBrowserWindow
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
    win: OverlayBrowserWindow,
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

            this.dashManager
              .updateDashboardConfig(config.id, config)
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

  updateOverlayWindowBounds(win: OverlayBrowserWindow): RectI {
    let screenRect: RectI = null
    this.updateOverlayPlacement(win, (placement, _dashboardConfig) => {
      const bounds = win.window.getBounds(),
        rect = RectI.create({
          size: pick(bounds, "width", "height"),
          position: pick(bounds, "x", "y")
        })

      screenRect = rect
      if (win.isVR) {
        placement.vrLayout.screenRect = rect
      } else {
        placement.screenRect = rect
      }
      debug(`Saving updated dashboard config updated rect`, rect)
      return placement
    })

    return RectI.toJson(screenRect) as RectI
  }

  getOverlayScreenRect(win: OverlayBrowserWindow): RectI {
    return asOption(win.placement?.screenRect)
      .filter(isDefined)
      .filter(isRectValid)
      .map(screenRect => RectI.toJson(screenRect) as RectI)
      .getOrCall(() => this.updateOverlayWindowBounds(win))
  }

  getOverlayVRLayout(win: OverlayBrowserWindow): VRLayout {
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
