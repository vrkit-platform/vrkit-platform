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
  VRLayout,
  VRPose
} from "vrkit-models"
import { isDefined } from "@3fv/guard"
import {
  assign,
  Disposables,
  hasProps,
  isDev,
  isEqual,
  isRectValid,
  Pair,
  pairOf,
  RectangleLayoutTool,
  removeIfMutation,
  SignalFlag,
  Triple,
  tripleOf
} from "vrkit-app-common/utils"
import {
  OverlayClientEventTypeToIPCName,
  OverlayManagerClientEventType,
  OverlayManagerClientFnType,
  OverlayManagerClientFnTypeToIPCName,
  OverlaysState,
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
import { defaultsDeep, flatten, pick } from "lodash"
import { NativeImageSequenceCapture } from "../../utils"
import { CreateNativeOverlayManager } from "vrkit-native-interop"

import { IValueDidChange, observe, toJS } from "mobx"
import { DashboardManager } from "../dashboard-manager"
import {
  assertIsValidOverlayUniqueId,
  isValidOverlayUniqueId,
  OverlayBrowserWindowType,
  overlayInfoToUniqueId,
  EditorInfoOverlayInfo,
  EditorInfoOverlayPlacement,
  EditorInfoScreenOverlayOUID,
  EditorInfoVROverlayOUID,
  isEditorInfoOUID
} from "vrkit-app-common/models"

import { OverlayEditorController } from "./OverlayEditorController"
import { BindAction } from "../../decorators"
import { ElectronMainActionManager } from "../electron-actions"
import ActionRegistry from "../../../common/services/actions/ActionRegistry"
import { match } from "ts-pattern"
import { getScreenRectangleLayoutTool, getVRRectangleLayoutTool } from "./OverlayLayoutTools"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

export type EditorInfoWithStatus = Triple<OverlayBrowserWindowType, boolean, OverlayBrowserWindow>

@Singleton()
export class OverlayManager {
  private overlayWindows_: OverlayBrowserWindow[] = []

  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  private readonly editorController_: OverlayEditorController

  private readonly disposers_ = new Disposables()

  //private stopObservingCallbacks = Array<IDisposer>()

  private readonly shutdownFlag_ = SignalFlag.new()

  private readonly frameSequenceCaptures_ = Array<NativeImageSequenceCapture>()

  private readonly nativeManager_ = CreateNativeOverlayManager()

  get state(): OverlaysState {
    return this.mainAppState.overlays
  }

  get editorEnabled(): boolean {
    return this.state.editor.enabled
  }

  get editorInfoWindows(): OverlayBrowserWindow[] {
    return pairOf(this.screenEditorInfoWindow, this.vrEditorInfoWindow)
  }

  get screenEditorInfoWindow(): OverlayBrowserWindow {
    return this.allOverlays.find(
      it => it.uniqueId === EditorInfoScreenOverlayOUID
    )
  }

  get vrEditorInfoWindow(): OverlayBrowserWindow {
    return this.allOverlays.find(
      it => it.uniqueId === EditorInfoVROverlayOUID
    )
  }

  get editorController(): OverlayEditorController {
    return this.editorController_
  }

  get isShutdown() {
    return this.shutdownFlag_.isSet
  }

  get isVREnabled() {
    return this.activeDashboardConfig.vrEnabled
  }

  get isScreenEnabled() {
    return this.activeDashboardConfig.screenEnabled
  }

  get allOverlays(): OverlayBrowserWindow[] {
    return this.overlayWindows_ ?? []
  }

  get vrOverlays() {
    return this.allOverlays.filter(it => it.isVR && !isEditorInfoOUID(it.uniqueId))
  }

  get screenOverlays() {
    return this.allOverlays.filter(it => it.isScreen && !isEditorInfoOUID(it.uniqueId))
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

        return newWin
      })
  }

  /**
   * Get or create VR Editor Window overlay
   * @private
   */
  private async getOrCreateEditorInfoWindow(kind: OverlayBrowserWindowType) {
    const { editorEnabled } = this
    if (!this.editorEnabled) {
      return null
    }

    const info = EditorInfoOverlayInfo,
      placement = EditorInfoOverlayPlacement,
      ouid = kind === OverlayBrowserWindowType.VR ? EditorInfoVROverlayOUID : EditorInfoScreenOverlayOUID

    let win = this.overlayWindowByUniqueId(ouid)
    if (win) {
      return win
    }

    win = await this.createOrUpdateOverlayBrowserWindow(info, placement, kind)

    try {
      await win.whenReady()
      this.overlayWindows_.push(win)
    } catch (err) {
      log.error(`Failed to create Editor Info window`, err)
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
      ).filter(isDefined<OverlayBrowserWindow>)
    )

    this.overlayWindows_ = overlayWindows
    this.editorController.update()

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
   * @param enabled
   */
  @BindAction()
  async setEditorEnabled(enabled: boolean) {
    if (this.editorEnabled === enabled) {
      return enabled
    }

    this.state.editor.enabled = enabled

    for (const ow of this.allOverlays) {
      ow.setEditorEnabled(enabled)
    }

    await this.checkEditorInfoWindows()

    return enabled
  }

  /**
   * Set editor enabled
   *
   * @param event
   * @param editorEnabled
   */
  async setEditorEnabledHandler(event: IpcMainInvokeEvent, editorEnabled: boolean): Promise<boolean> {
    return this.setEditorEnabled(editorEnabled)
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
    app.on("quit", this.unload)

    const { sessionManager } = this,
      ipcFnHandlers = Array<Pair<OverlayManagerClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
        [OverlayManagerClientFnType.FETCH_WINDOW_ROLE, this.fetchOverlayWindowRoleHandler.bind(this)],
        [OverlayManagerClientFnType.FETCH_CONFIG_ID, this.fetchOverlayConfigIdHandler.bind(this)],
        [OverlayManagerClientFnType.SET_EDITOR_ENABLED, this.setEditorEnabledHandler.bind(this)],
        [OverlayManagerClientFnType.CLOSE, this.closeHandler.bind(this)]
      ),
      ipcEventHandlers = Array<Pair<SessionManagerEventType, (...args: any[]) => void>>([
        SessionManagerEventType.DATA_FRAME,
        this.onSessionDataFrameEvent.bind(this)
      ])

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayManagerClientFnTypeToIPCName(type), handler))

    this.disposers_.push(
      observe(this.mainAppState.sessions, "activeSessionId", this.onActiveSessionIdChanged),
      observe(this.mainAppState.dashboards, "activeConfigId", this.onActiveDashboardConfigIdChanged),
      () => {
        ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(OverlayManagerClientFnTypeToIPCName(type)))
        ipcEventHandlers.forEach(([type, handler]) => sessionManager.off(type, handler))
        app.off("quit", this.unload)

        Object.assign(global, {
          overlayManager: undefined
        })
      }
    )

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })
    }

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        return this.unload()
      })
    }

    ipcEventHandlers.forEach(([type, handler]) => sessionManager.on(type, handler))
  }

  /**
   * Service constructor
   *
   * @param container
   * @param actionRegistry
   * @param mainActionManager
   * @param sessionManager
   * @param appSettingsService
   * @param mainWindowManager
   * @param mainAppState
   * @param dashManager
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly actionRegistry: ActionRegistry,
    readonly mainActionManager: ElectronMainActionManager,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: MainWindowManager,
    readonly mainAppState: MainSharedAppState,
    readonly dashManager: DashboardManager
  ) {
    this.editorController_ = new OverlayEditorController(this.container, this)
  }

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
      this.nativeManager_.releaseResources(overlayUniqueId, windowId)
      removeIfMutation(this.overlayWindows_, overlay => overlay.windowId === windowId)
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
  createOnPaintHandler(targetPlacement: OverlayPlacement, win: OverlayBrowserWindow) {
    let cap: NativeImageSequenceCapture = asOption(this.mainAppState.devSettings?.imageSequenceCapture)
      .filter(it => it !== false)
      .map(
        ({ format, outputPath }) => new NativeImageSequenceCapture(win.config.overlay.id + "-paint", format, outputPath)
      )
      .getOrNull()

    return (_ev: Electron.Event, dirty: Electron.Rectangle, image: NativeImage) => {
      const buf = image.getBitmap(),
        imageSize = image.getSize(),
        vrLayout = win.placement.vrLayout,// this.getOverlayVRLayout(win),
        screenRect = vrLayout.screenRect
      
      screenRect.size = {width: imageSize.width, height: imageSize.height}
      
      // if (win.isEditorInfo) {
      //   log.info(`onPaint editor info frame`, imageSize, VRLayout.toJson(vrLayout))
      // }
      
      if (!imageSize.width || !imageSize.height) {
        log.warn(`Invalid image size, ignoring frame`, imageSize)
        return;
      }
      //log.info(`OnPaint event`, win.uniqueId, "size", imageSize, "dirty",
      // dirty, "vrLayout", vrLayout)
      this.nativeManager_.createOrUpdateResources(
        win.uniqueId,
        win.windowId,
        // { width: dirty.width, height: dirty.height },
        { width: imageSize.width, height: imageSize.height },
        vrLayout.screenRect,
        vrLayout
      )
      this.nativeManager_.processFrame(win.uniqueId, buf)
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
   * @param targetPlacement
   * @param win
   * @private
   */
  private createOnBoundsChangedHandler(targetPlacement: OverlayPlacement, win: OverlayBrowserWindow): Function {
    return (event: Electron.Event) => {
      this.updateScreenOverlayWindowBounds(win)

      this.autoLayoutEditorInfoWindows()
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

  getOverlayWindowScreenRect(win: OverlayBrowserWindow): RectI {
    const bounds = win.window.getBounds()
    return RectI.create({
      size: pick(bounds, "width", "height"),
      position: pick(bounds, "x", "y")
    })
  }

  updateScreenOverlayWindowBounds(win: OverlayBrowserWindow): RectI {
    const screenRect = this.getOverlayWindowScreenRect(win)

    if (win.isVR || win.role !== OverlayWindowRole.OVERLAY) {
      log.warn(`Ignoring bounds change as this is not a standard overlay window`, win.id, win.role)
      return screenRect
    }

    this.updateOverlayPlacement(win, (placement, _dashboardConfig) => {
      if (win.isVR) {
        return placement
      }
      placement.screenRect = screenRect
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
      .getOrCall(() => this.updateScreenOverlayWindowBounds(win))
  }

  getOverlayVRLayout(win: OverlayBrowserWindow): VRLayout {
    return asOption(win.placement?.vrLayout)
      .filter(isDefined)
      .filter(hasProps("size", "pose", "screenRect"))
      .map(vrLayout =>
        VRLayout.toJson(
          vrLayout, {
            emitDefaultValues: true
          }
        )
      )
      .getOrThrow() as VRLayout
  }

  /**
   * Get editor info windows with status & enablement
   */
  get editorInfoWindowsWithStatus(): Array<EditorInfoWithStatus> {
    return pairOf(
      tripleOf(OverlayBrowserWindowType.VR, this.isVREnabled, this.vrEditorInfoWindow),
      tripleOf(OverlayBrowserWindowType.SCREEN, this.isScreenEnabled, this.screenEditorInfoWindow)
    )
  }

  /**
   * Auto layout the editor info windows
   */
  autoLayoutEditorInfoWindows() {
    if (!this.editorEnabled) {
      return
    }

    this.editorInfoWindowsWithStatus
      .filter(([_, enabled, win]: EditorInfoWithStatus) => !!enabled && isDefined<OverlayBrowserWindow>(win))
      .forEach(([kind, _, win]: EditorInfoWithStatus) => {
        match(kind === OverlayBrowserWindowType.VR)
          .with(true, () => {
            const tool = getVRRectangleLayoutTool()
            this.vrOverlays
              .map(it => it.placement.vrLayout)
              .map(vrl => new RectangleLayoutTool.Rectangle(vrl.pose.x, vrl.pose.eyeY, vrl.size.width, vrl.size.height))
              .forEach(rect => {
                tool.push(rect)
              })

            const { placement } = win,
              size = placement.vrLayout.size,
              newPosition = tool.findPositionClosestToAnchor(size.width, size.height),
              newPose = assign(VRPose.clone(placement.vrLayout.pose), {
                x: newPosition.x,
                eyeY: newPosition.y
              })

            log.info(`New EditorInfo VR pose`, newPose)
            placement.vrLayout.pose = newPose
            win.invalidate()
          })
          .otherwise(() => {
            const tool = getScreenRectangleLayoutTool()
            this.screenOverlays
              .map(it => it.placement.screenRect)
              .map(
                rect =>
                  new RectangleLayoutTool.Rectangle(rect.position.x, rect.position.y, rect.size.width, rect.size.height)
              )
              .forEach(rect => {
                tool.push(rect)
              })

            const { placement } = win,
              size = placement.screenRect.size,
              newPosition = tool.findPositionClosestToAnchor(size.width, size.height)

            log.info(`New EditorInfo Screen position`, newPosition)
            placement.screenRect.position = newPosition

            win.setBounds(placement.screenRect)
          })
      })
  }

  /**
   * Setup VR Editor Window based on current mode
   *
   * @private
   */
  private async checkEditorInfoWindows() {
    const windows = this.editorInfoWindowsWithStatus

    await match(this.editorEnabled)
      .with(false, () =>
        Promise.all(
          windows.map(async ([kind, kindEnabled, win]) => {
            if (win) {
              await win.close()

              removeIfMutation(this.overlayWindows_, it => it.uniqueId === win.uniqueId)
            }
          })
        )
      )
      .otherwise(async () => {
        await Promise.all(
          windows.map(async ([kind, enabled, win]) => {
            if (enabled && !win) {
              win = await this.getOrCreateEditorInfoWindow(kind)
            }

            if (win) win.setEditorEnabled(this.editorEnabled)
          })
        )

        this.autoLayoutEditorInfoWindows()
      })
  }
}

export default OverlayManager
