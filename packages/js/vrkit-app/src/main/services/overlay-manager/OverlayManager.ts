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
import { isDefined, isFunction } from "@3fv/guard"
import {
  assign,
  Disposables,
  hasProps,
  isDev,
  isEqual,
  isRectValid,
  Pair, removeIfMutation,
  SignalFlag
} from "vrkit-app-common/utils"
import {
  OverlayClientEventTypeToIPCName,
  OverlayManagerClientEventType,
  OverlayManagerClientFnType,
  OverlayManagerClientFnTypeToIPCName,
  OverlayMode,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents,
  OverlayWindowRole
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
import { OverlayBrowserWindow } from "./OverlayBrowserWindow"
import { MainWindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { flatten, pick } from "lodash"
import { NativeImageSequenceCapture } from "../../utils"
import { CreateNativeOverlayManager } from "vrkit-native-interop"

import { IValueDidChange, observe, toJS } from "mobx"
import { IDisposer } from "mobx-utils"
import { DashboardManager } from "../dashboard-manager"
import {
  assertIsValidOverlayUniqueId,
  isValidOverlayUniqueId,
  OverlayBrowserWindowType,
  overlayInfoToUniqueId
} from "./OverlayManagerUtils"
import { VREditorOverlayInfo, VREditorOverlayOUID, VREditorOverlayPlacement } from "./DefaultOverlayConfigData"
import { OverlayVREditorController } from "./OverlayVREditorController"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

@Singleton()
export class OverlayManager {
  private overlayWindows_: OverlayBrowserWindow[] = []

  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  private vrEditorController_: OverlayVREditorController = null
  
  private readonly disposers_ = new Disposables()

  //private stopObservingCallbacks = Array<IDisposer>()

  private readonly shutdownFlag_ = SignalFlag.new()

  private readonly frameSequenceCaptures_ = Array<NativeImageSequenceCapture>()

  private readonly nativeManager_ = CreateNativeOverlayManager()

  get vrEditorWindow(): OverlayBrowserWindow {
    return this.vrOverlays.find(it => it.uniqueId === VREditorOverlayOUID || it.role === OverlayWindowRole.VR_EDITOR)
  }

  get vrEditorController(): OverlayVREditorController {
    return this.vrEditorController_
  }
  
  get isShutdown() {
    return this.shutdownFlag_.isSet
  }

  get mode() {
    return this.mainAppState.overlayMode
  }

  get isEditMode() {
    return this.mode === OverlayMode.EDIT
  }

  get isVREnabled() {
    return this.activeDashboardConfig.vrEnabled
  }

  get allOverlays(): OverlayBrowserWindow[] {
    return this.overlayWindows_ ?? []
  }

  get vrOverlays() {
    return this.allOverlays.filter(it => it.isVR)
  }

  get screenOverlays() {
    return this.allOverlays.filter(it => it.isScreen)
  }

  get activeDashboardId() {
    return this.dashManager.activeDashboardId
  }

  get activeDashboardConfig(): DashboardConfig {
    return this.dashManager.activeDashboardConfig
  }

  getOverlayByWindowId(windowId: number) {
    return this.allOverlays.find(overlay => overlay.windowId === windowId)
  }

  async closeAllOverlays(): Promise<void> {
    await Promise.all(this.allOverlays.map(overlay => overlay.close()))
    this.overlayWindows_ = []
  }

  overlayWindowByUniqueId(overlayInfo: OverlayInfo, kind: OverlayBrowserWindowType): OverlayBrowserWindow
  overlayWindowByUniqueId(uniqueId: string): OverlayBrowserWindow
  overlayWindowByUniqueId(
    idOrComponentId: string,
    windowKind: OverlayBrowserWindowType,
    kind: OverlayKind
  ): OverlayBrowserWindow
  overlayWindowByUniqueId(...args: any[]): OverlayBrowserWindow {
    const uniqueId =
      args.length === 1 || isValidOverlayUniqueId(args[0] as string)
        ? (args[0] as string)
        : ((overlayInfoToUniqueId as any)(...args) as string)

    assertIsValidOverlayUniqueId(uniqueId)

    return this.allOverlays.find(win => win.uniqueId === uniqueId)
  }

  private createOrUpdateOverlayBrowserWindow(
    overlayInfo: OverlayInfo,
    placement: OverlayPlacement,
    windowKind: OverlayBrowserWindowType
  ): OverlayBrowserWindow {
    const ouid = overlayInfoToUniqueId(overlayInfo, windowKind)
    return asOption(this.overlayWindowByUniqueId(ouid))
      .ifSome(win => {
        // TODO: implement updating here, settings
        //  in the case of VR, also update the
        //   placement & pose
      })
      .getOrCall(() => {
        // CREATE NEW WINDOW
        this.sessionManager.registerComponentDataVars(ouid, overlayInfo.dataVarNames)
        const newWin = OverlayBrowserWindow.create(this, windowKind, overlayInfo, placement),
          onBoundsChanged = this.createOnBoundsChangedHandler(placement, newWin)

        // ATTACH LISTENERS
        newWin.window
          .on("closed", this.createOnCloseHandler(ouid, newWin.windowId))
          .on("moved", onBoundsChanged)
          .on("resized", onBoundsChanged)

        // CONFIGURE THE `webContents` OF THE NEW WINDOW
        asOption(newWin.window.webContents)
          .tap(it => it.setFrameRate(overlayInfo.settings?.fps ?? 10))
          .tapIf(windowKind === OverlayBrowserWindowType.VR, it =>
            it.on("paint", this.createOnPaintHandler(placement, newWin))
          )

        return newWin
      })
  }

  /**
   * Get or create VR Editor Window overlay
   * @private
   */
  private async getOrCreateVREditorWindow() {
    const mode = this.mode
    if (!this.isEditMode || !this.isVREnabled) {
      return null
    }

    const info = VREditorOverlayInfo
    const placement = VREditorOverlayPlacement
    const ouid = VREditorOverlayOUID
    let win = this.overlayWindowByUniqueId(ouid)
    if (win) {
      return win
    }

    win = await this.createOrUpdateOverlayBrowserWindow(info, placement, OverlayBrowserWindowType.VR)
    
    try {
      await win.whenReady()
      this.overlayWindows_.push(win)
    } catch (err) {
      log.error(`Failed to create VREditor window`, err)
      if (win) {
        await win.close()
      }

      return null
    }

    return win
  }

  @Bind
  async onActiveDashboardConfigIdChanged(change: IValueDidChange<string>) {
    const config = this.activeDashboardConfig
    await this.closeAllOverlays()
    if (!config) {
      log.warn("No dashboard config provided to open, closed all")
      return
    }
    const overlayWindows = Array<OverlayBrowserWindow>()

    const activePlayer = this.sessionManager.getActivePlayer()
    const overlayMap = config.overlays.filter(isDefined<OverlayInfo>).reduce((map, overlayInfo) => {
      // activePlayer.getDataVariables(...(overlayInfo.dataVarNames ?? []))

      return {
        ...map,
        [overlayInfo.id]: overlayInfo
      }
    }, {}) as { [id: string]: OverlayInfo }

    overlayWindows.push(
      ...flatten(
        config.placements.map(placement => {
          const overlay = overlayMap[placement.overlayId]
          if (!overlay) {
            log.error("Unable to locate overlay with id", placement.overlayId)
            return null
          }

          const windows = Array<OverlayBrowserWindow>()

          if (config.screenEnabled) {
            windows.push(this.createOrUpdateOverlayBrowserWindow(overlay, placement, OverlayBrowserWindowType.SCREEN))
          }

          if (config.vrEnabled) {
            windows.push(this.createOrUpdateOverlayBrowserWindow(overlay, placement, OverlayBrowserWindowType.VR))
          }
          return windows
        })
      )
    )

    this.overlayWindows_ = overlayWindows

    if (overlayWindows.length) {
      await Promise.all(overlayWindows.map(overlay => overlay.whenReady()))
    }
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

    // this.broadcastRendererOverlays(PluginClientEventType.SESSION_INFO,
    // activeSession?.id, toJS(activeSession?.info))
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
      overlayWindow = this.allOverlays.find(it => it.window?.id === windowId)

    return overlayWindow?.config?.overlay?.id
  }

  async fetchOverlayWindowRoleHandler(event: IpcMainInvokeEvent): Promise<OverlayWindowRole> {
    const window = BrowserWindow.fromWebContents(event.sender),
      overlayWindow = this.allOverlays.find(it => it.window?.id === window.id)

    return overlayWindow?.role
  }

  /**
   * ipcMain invoke handler for window close
   * @param event
   * @private
   */
  private async closeHandler(event: IpcMainInvokeEvent): Promise<void> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.allOverlays.find(it => it.window?.id === windowId)

    if (overlayWindow) {
      await overlayWindow.close()
    } else {
      log.warn(`Unable to find overlay window with id: ${windowId}`)
    }
  }

  /**
   * Set overlay mode
   *
   * @param mode
   */
  async setOverlayMode(mode: OverlayMode) {
    if (mode === this.mode) {
      log.debug(`mode is unchanged`, mode, this.mode)
      return mode
    }

    this.mainAppState.setOverlayMode(mode)
    this.setupVREditorController()
    
    for (const ow of this.allOverlays) {
      ow.setMode(mode)
    }

    
    await this.setupVREditorWindow()
    
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

    const overlays = this.allOverlays ?? []

    await Promise.all(
      overlays.map(o => {
        o.window?.webContents?.endFrameSubscription()
        return o.close()
      })
    )
      .then(() => info(`All windows closed`))
      .catch(err => warn(`error closing windows`, err))

    this.overlayWindows_ = []
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
    app.on("before-quit", this.unload)

    const { sessionManager } = this,
      ipcFnHandlers = Array<Pair<OverlayManagerClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
        [OverlayManagerClientFnType.FETCH_WINDOW_ROLE, this.fetchOverlayWindowRoleHandler.bind(this)],
        [OverlayManagerClientFnType.FETCH_CONFIG_ID, this.fetchOverlayConfigIdHandler.bind(this)],
        [OverlayManagerClientFnType.SET_OVERLAY_MODE, this.setOverlayModeHandler.bind(this)],
        [OverlayManagerClientFnType.CLOSE, this.closeHandler.bind(this)]
      ),
      sessionManagerEventHandlers = Array<Pair<SessionManagerEventType, (...args: any[]) => void>>([
        SessionManagerEventType.DATA_FRAME,
        this.onSessionDataFrameEvent.bind(this)
      ])

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayManagerClientFnTypeToIPCName(type), handler))

    this.disposers_.push(
      observe(this.mainAppState.sessions, "activeSessionId", this.onActiveSessionIdChanged)
    )

    this.disposers_.push(
      observe(this.mainAppState.dashboards, "activeConfigId", this.onActiveDashboardConfigIdChanged)
    )
    // this.stopObserving = deepObserve(this.mainAppState.sessions,
    // "activeSessionId", this.onActiveSessionIdChanged)

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })
    }

    this.disposers_.push(() => {
      // this.stopObservingCallbacks.filter(isFunction).forEach(fn => fn())

      ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(OverlayManagerClientFnTypeToIPCName(type)))
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
    @InjectContainer()
    readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: MainWindowManager,
    readonly mainAppState: MainSharedAppState,
    readonly dashManager: DashboardManager
  ) {}

  /**
   * Broadcast to overlay windows
   *
   * @param type
   * @param args
   * @private
   */
  private broadcastRendererOverlays(type: OverlayManagerClientEventType | PluginClientEventType, ...args: any[]): void {
    const ipcEventName = OverlayClientEventTypeToIPCName(type)
    const jsArgs = args.map(arg => toJS(arg))
    this.allOverlays.forEach(overlay => {
      if (overlay.ready) {
        overlay.window?.webContents?.send(ipcEventName, ...jsArgs)
      }
    })
  }

  /**
   * Broadcast an event to the main window
   *
   * @param type
   * @param args
   * @private
   */
  private broadcastRendererMainWindow(
    type: OverlayManagerClientEventType | PluginClientEventType,
    ...args: any[]
  ): void {
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
    return this.allOverlays.some(it => it.window?.id === windowId)
  }

  /**
   * Create on window close handler
   * @param overlayUniqueId
   * @param windowId
   * @private
   */
  private createOnCloseHandler(overlayUniqueId: string, windowId: number): Function {
    return (event: Electron.Event) => {
      this.sessionManager.unregisterComponentDataVars(overlayUniqueId)
      this.overlayWindows_ = this.allOverlays.filter(overlay => overlay.windowId !== windowId)
    }
  }

  /**
   * On paint handler (not used at the moment, but if render model is changed,
   * it may)
   *
   * @param targetPlacement
   * @param win
   * @private
   */
  private createOnPaintHandler(targetPlacement: OverlayPlacement, win: OverlayBrowserWindow) {
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
      if (cap) {
        cap.push(image)
      }
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
      if (cap) {
        cap.push(image)
      }
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
  private createOnBoundsChangedHandler(targetPlacement: OverlayPlacement, win: OverlayBrowserWindow): Function {
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
    const bounds = win.window.getBounds(),
      screenRect = RectI.create({
        size: pick(bounds, "width", "height"),
        position: pick(bounds, "x", "y")
      })

    if (win.role !== OverlayWindowRole.OVERLAY) {
      log.warn(`Ignoring bounds change as this is not a standard overlay window`, win.id, win.role)
      return screenRect
    }

    this.updateOverlayPlacement(win, (placement, _dashboardConfig) => {
      if (win.isVR) {
        placement.vrLayout.screenRect = screenRect
      } else {
        placement.screenRect = screenRect
      }
      debug(`Saving updated dashboard config updated rect`, screenRect)
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

  /**
   * Setup VR Editor Window based on current mode
   *
   * @private
   */
  private async setupVREditorWindow() {
    let vrEditorWindow = this.vrEditorWindow

    if (!this.isEditMode || !this.isVREnabled) {
      if (vrEditorWindow) {
        await vrEditorWindow.close()
      }
      
      removeIfMutation(this.overlayWindows_, it => it.uniqueId === VREditorOverlayOUID || it.role === OverlayWindowRole.VR_EDITOR)
      return null
    }

    if (!vrEditorWindow) {
      vrEditorWindow = await this.getOrCreateVREditorWindow()
    }

    vrEditorWindow.setMode(this.mode)
  }
  
  setupVREditorController():OverlayVREditorController {
    
      if (!this.isEditMode || !this.isVREnabled) {
        log.error(`VREditorController requires edit mode & VR enabled`)
        if (this.vrEditorController_) {
          this.vrEditorController_.destroy()
          this.vrEditorController_ = null
        }
        return null
      }
      
      if (!this.vrEditorController_) {
        this.vrEditorController_ = new OverlayVREditorController(this)
      }
    
    return this.vrEditorController_
    
    
  }
}

export default OverlayManager
