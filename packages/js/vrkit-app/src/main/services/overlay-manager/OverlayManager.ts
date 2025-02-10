import { getLogger } from "@3fv/logger-proxy"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, NativeImage, screen } from "electron"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  ActiveSessionType,
  assertIsValidOverlayUniqueId,
  assign,
  Bind,
  Disposables,
  electronRectangleToRectI,
  hasProps,
  isEqual,
  isEqualSize,
  isRectValid,
  isValidOverlayUniqueId,
  OverlayBrowserWindowType,
  OverlayClientEventTypeToIPCName,
  overlayInfoToUniqueId,
  OverlayManagerClientEventType,
  OverlayManagerClientFnType,
  OverlayManagerClientFnTypeToIPCName,
  OverlaysState,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents,
  OverlayWindowRole,
  Pair,
  removeIfMutation,
  SessionDetail,
  SessionManagerEventType,
  SignalFlag,
  Triple, WindowRenderMode
} from "@vrkit-platform/shared"
import {
  DashboardConfig,
  OverlayInfo,
  OverlayKind,
  OverlayPlacement,
  RectI,
  SessionDataVariableValueMap,
  SessionTiming,
  VRLayout
} from "@vrkit-platform/models"
import { guard, isDefined } from "@3fv/guard"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import { PluginClientEventType } from "@vrkit-platform/plugin-sdk"
import { AppSettingsService } from "../app-settings"
import PQueue from "p-queue"
import { OverlayBrowserWindow } from "./OverlayBrowserWindow"
import { WindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { flatten, pick } from "lodash"
import { NativeImageSequenceCapture } from "../../utils"
import { CreateNativeOverlayManager, NativeOverlayManager } from "vrkit-native-interop"

import { IValueDidChange, observe, reaction, runInAction, set, toJS } from "mobx"
import { DashboardManager } from "../dashboard-manager"

import { OverlayEditorController } from "./OverlayEditorController"
import { ElectronMainActionManager } from "../electron-actions"
import { isValidOverlayScreenSize } from "./OverlayLayoutTools"
import { AppPaths } from "@vrkit-platform/shared/constants/node"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

function vrLayoutToJsonString(vrLayout: VRLayout): string {
  return VRLayout.toJsonString(toJS(vrLayout), {
    prettySpaces: 2
  })
}

@Singleton()
export class OverlayManager {
  private overlayWindows_: OverlayBrowserWindow[] = []

  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  private readonly editorController_: OverlayEditorController

  private readonly disposers_ = new Disposables()

  private readonly shutdownFlag_ = SignalFlag.new()

  private readonly frameSequenceCaptures_ = Array<NativeImageSequenceCapture>()

  private nativeManager_: NativeOverlayManager = null

  get state(): OverlaysState {
    return this.mainAppState.overlays
  }

  get editorEnabled(): boolean {
    return this.state.editor.enabled
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
    return this.allOverlays.find(overlay => overlay.browserWindowId === windowId)
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
        this.updateDataVars(ouid, overlayInfo)

        const newWin = OverlayBrowserWindow.create(
          this,
          this.windowManager,
          windowKind,
          overlayInfo,
          placement,
          (type, browserWindow, windowInstance) => {
            // const ow = this.allOverlays.find(it => it?.browserWindow?.id === browserWindow.id)
            // if (!ow) {
            //   log.warn(`Unable to find matching overlay browser window for id (${browserWindow.id})`)
            //   return
            // }
            if (type === "Created") {
              // ATTACH LISTENERS
              browserWindow.on("closed", this.createOnCloseHandler(ouid, browserWindow.id))
              if (windowInstance.config.renderMode === WindowRenderMode.Screen) {
                const onBoundsChanged = this.createOnBoundsChangedHandler(placement, browserWindow)
                browserWindow.on("moved", onBoundsChanged).on("resized", onBoundsChanged)
              }
            }
          }
        )

        return newWin
      })
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

  private onSessionDataFrameEvent(
    sessionId: string,
    timing: SessionTiming,
    dataVarValues: SessionDataVariableValueMap
  ) {
    this.broadcastRendererOverlays(
      PluginClientEventType.DATA_FRAME,
      sessionId,
      timing,
      // this.sessionManager.activeSession?.timeAndDuration,
      dataVarValues
    )
  }

  async fetchOverlayConfigIdHandler(event: IpcMainInvokeEvent): Promise<string> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.allOverlays.find(it => it.browserWindow?.id === windowId)

    return overlayWindow?.config?.overlay?.id
  }

  async fetchOverlayWindowRoleHandler(event: IpcMainInvokeEvent): Promise<OverlayWindowRole> {
    const window = BrowserWindow.fromWebContents(event.sender),
      overlayWindow = this.allOverlays.find(it => it.browserWindow?.id === window.id)

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
      overlayWindow = this.allOverlays.find(it => it.browserWindow?.id === windowId)

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
  @Bind
  async setEditorEnabled(enabled: boolean) {
    runInAction(() => {
      if (this.editorEnabled === enabled) {
        return enabled
      }

      this.state.editor.enabled = enabled

      for (const ow of this.allOverlays) {
        ow.setEditorEnabled(enabled)
      }
    })

    return enabled
  }

  async [Symbol.asyncDispose]() {
    debug(`Unloading OverlayManager`)

    this.disposers_.dispose()

    const overlays = this.allOverlays ?? []

    await Promise.all(
      overlays.map(o => {
        guard(() => o.browserWindow?.webContents?.endFrameSubscription())
        return o.close()
      })
    )
      .then(() => {
        info(`All overlay windows closed`)
      })
      .catch(err => {
        warn(`error closing overlays`, err)
      })

    this.overlayWindows_ = []
  }

  /**
   * Set editor enabled
   *
   * @param _event
   * @param editorEnabled
   */
  private async handleSetEditorEnabled(_event: IpcMainInvokeEvent, editorEnabled: boolean): Promise<boolean> {
    return this.setEditorEnabled(editorEnabled)
  }

  /**
   * Handler for a layout editor to change/set the VRLayout
   * of a specific placement
   *
   * @param _ev
   * @param placementId
   * @param vrLayoutJson
   */
  private async handleSetVRLayout(_ev: IpcMainInvokeEvent, placementId: string, vrLayoutJson: VRLayout) {
    const ow = this.vrOverlays.find(ow => ow.placement.id === placementId)
    log.assert(!!ow, `Unable to find VR OverlayWindow with placement id (${placementId})`)
    this.updateOverlayPlacement(ow, (placement, dashboardConfig) => {
      const vrLayout = VRLayout.create(vrLayoutJson)
      log.info(`Changing VRLayout for placement (${placementId}) from
        (${vrLayoutToJsonString(placement.vrLayout)})
        to
        (${vrLayoutToJsonString(vrLayout)})`)

      set(placement, "vrLayout", vrLayout)
      return placement
    })

    log.info(`Set VRLayout for placement (${placementId})`)
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Electron.Event = null) {
    return this[Symbol.asyncDispose]()
  }

  @Bind
  private onActiveSessionIdChanged(change: IValueDidChange<string>) {
    log.info(`Active session id changed from (${change.oldValue}) to (${change.newValue}) `, change)
    const { activeSessionId, activeSessionType, activeSession } = this.sessionManager
    this.updateActiveSession(activeSessionId, activeSessionType, activeSession, change.oldValue)
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  protected async init(): Promise<void> {
    // app.on("quit", this.unload)

    this.nativeManager_ = await CreateNativeOverlayManager()
    const { sessionManager } = this,
      ipcFnHandlers = Array<Pair<OverlayManagerClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
        [OverlayManagerClientFnType.FETCH_WINDOW_ROLE, this.fetchOverlayWindowRoleHandler.bind(this)],
        [OverlayManagerClientFnType.FETCH_CONFIG_ID, this.fetchOverlayConfigIdHandler.bind(this)],
        [OverlayManagerClientFnType.SET_VR_LAYOUT, this.handleSetVRLayout.bind(this)],
        [OverlayManagerClientFnType.SET_EDITOR_ENABLED, this.handleSetEditorEnabled.bind(this)],
        [OverlayManagerClientFnType.CLOSE, this.closeHandler.bind(this)]
      ),
      sessionEventHandlers = Array<Pair<SessionManagerEventType, (...args: any[]) => void>>([
        SessionManagerEventType.DATA_FRAME,
        this.onSessionDataFrameEvent.bind(this)
      ])

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayManagerClientFnTypeToIPCName(type), handler))

    this.disposers_.push(
      observe(this.mainAppState.sessions, "activeSessionId", this.onActiveSessionIdChanged),
      observe(this.mainAppState.dashboards, "activeConfigId", this.onActiveDashboardConfigIdChanged),
      reaction(
        () => toJS(this.mainAppState.plugins.plugins),
        () => this.onPluginInstallsChanged(),
        { equals: isEqual }
      ),
      () => {
        ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(OverlayManagerClientFnTypeToIPCName(type)))
        sessionEventHandlers.forEach(([type, handler]) => sessionManager.off(type, handler))
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

    sessionEventHandlers.forEach(([type, handler]) => sessionManager.on(type, handler))
  }

  @Bind
  private onPluginInstallsChanged() {
    log.info("Plugin change detected, updating all overlay window data vars")
    this.updateAllDataVars()
  }

  /**
   * Service constructor
   *
   * @param container
   * @param windowManager
   * @param mainActionManager
   * @param sessionManager
   * @param appSettingsService
   * @param mainWindowManager
   * @param mainAppState
   * @param dashManager
   */
  constructor(
    @InjectContainer()
    readonly container: Container,
    readonly windowManager: WindowManager,
    readonly mainActionManager: ElectronMainActionManager,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: WindowManager,
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
        asOption(overlay.browserWindow)
          .filter(win => !win.isDestroyed() && !win.webContents.isDestroyed() && !win.webContents.isCrashed())
          .tap(win => win.webContents?.send(ipcEventName, ...jsArgs))
      }
    })
  }

  /**
   * Check if `windowId` is valid
   *
   * @param windowId
   * @private
   */
  private isValidOverlayWindowId(windowId: number): boolean {
    return this.allOverlays.some(it => it.browserWindow?.id === windowId)
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
      log.info(`onCloseHandler for overlay/window`, overlayUniqueId, windowId)
      this.nativeManager_?.releaseResources(overlayUniqueId, windowId)
      removeIfMutation(this.overlayWindows_, overlay => overlay.browserWindowId === windowId)
    }
  }

  /**
   * Create a frame processor to be used with `paint` & `frameSubscription`
   *
   * @param win
   * @param capSuffix
   * @private
   */
  private createFrameProcessor(win: OverlayBrowserWindow, capSuffix: string) {
    const cap: NativeImageSequenceCapture = asOption(this.mainAppState.devSettings?.imageSequenceCapture)
      .filter(it => it !== false)
      .map(
        ({ format, outputPath }) =>
          new NativeImageSequenceCapture(`${win.config.overlay.id}-${capSuffix}`, format, outputPath)
      )
      .getOrNull()

    return (image: NativeImage) => {
      const buf = image.getBitmap(),
        nativeImageSize = image.getSize(),
        vrLayout = toJS(win.placement.vrLayout),
        screenRect = asOption(win.browserWindow)
          .map(bw => screen.dipToScreenRect(bw, bw.getBounds()))
          .map(electronRectangleToRectI)
          .getOrThrow() as RectI,
        imageSize = {
          width:
            nativeImageSize.width > 0 ? Math.min(screenRect.size.width, nativeImageSize.width) : screenRect.size.width,
          height:
            nativeImageSize.height > 0
              ? Math.min(screenRect.size.height, nativeImageSize.height)
              : screenRect.size.height
        }

      if (cap) {
        cap.push(image)
      }

      if (!this.nativeManager_) {
        return
      }

      if (!isValidOverlayScreenSize(imageSize) || !isEqualSize(imageSize, nativeImageSize)) {
        if (log.isDebugEnabled()) {
          log.debug(
            `[${win.uniqueId}]: Invalid imageSize=`,
            imageSize,
            `,nativeImageSize=`,
            nativeImageSize,
            ` ignoring frame.  Window bounds=`,
            win.browserWindow.getBounds()
          )
        }

        return
      }

      this.nativeManager_.createOrUpdateResources(
        win.uniqueId,
        win.browserWindowId,
        { width: imageSize.width, height: imageSize.height },
        screenRect,
        vrLayout
      )
      this.nativeManager_.processFrame(win.uniqueId, buf)
    }
  }

  /**
   * On paint handler (not used at the moment, but if render model is changed,
   * it may)
   *
   * @param win
   * @private
   */
  createOnPaintHandler(win: OverlayBrowserWindow) {
    const frameProcessor = this.createFrameProcessor(win, "paint")

    return (_ev: Electron.Event, _dirty: Electron.Rectangle, image: NativeImage) => {
      frameProcessor(image)
    }
  }

  private createOnFrameHandler(config: DashboardConfig, targetPlacement: OverlayPlacement, win: OverlayBrowserWindow) {
    const frameProcessor = this.createFrameProcessor(win, "frame")

    return (image: NativeImage, _dirty: Electron.Rectangle) => {
      frameProcessor(image)
    }
  }

  /**
   * Create a bounds changed (`moved`, `resized`) event handler
   *
   * @param targetPlacement
   * @param win
   * @private
   */
  private createOnBoundsChangedHandler(targetPlacement: OverlayPlacement, win: BrowserWindow): Function {
    return (_event: Electron.Event) => {
      asOption(this.overlayWindows_.find(ow => ow.browserWindowId === win.id))
          .ifSome(ow => {
            this.updateScreenOverlayWindowBounds(ow)
          })
    }
  }

  //
  // /**
  //  * Create a delete dashboard config task
  //  *
  //  * @param id
  //  * @private
  //  */
  // private createDeleteDashboardConfigTask(id: string) {
  //   return async () => {
  //     const dashFile = Path.join(AppPaths.dashboardsDir, id +
  // FileExtensions.Dashboard) info(`Deleting dashboard ${dashFile}`)  await
  // Fsx.unlink(dashFile) } }  private createSaveDashboardConfigTask(config:
  // DashboardConfig) { return async () => { const dashFile =
  // Path.join(AppPaths.dashboardsDir, config.id + FileExtensions.Dashboard)
  // info(`Saving dashboard ${dashFile}`)  await Fsx.writeJSON(dashFile,
  // DashboardConfig.toJson(config)) } }

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
          Some: placement =>
            runInAction(() => {
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
            })
        })
      )
      .getOrNull()
  }

  getOverlayWindowScreenRect(win: OverlayBrowserWindow): RectI {
    const bounds = win.browserWindow.getBounds()
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
        VRLayout.toJson(vrLayout, {
          emitDefaultValues: true
        })
      )
      .getOrThrow() as VRLayout
  }

  private updateAllDataVars() {
    for (const ow of this.overlayWindows_) {
      if (ow.config?.overlay) {
        this.updateDataVars(ow.uniqueId, ow.config.overlay)
      }
    }
  }

  private updateDataVars(ouid: string, overlayInfo: OverlayInfo): void {
    runInAction(() => {
      const dataVarNames = overlayInfo.dataVarNames ?? []
      for (const [id, install] of Object.entries(this.mainAppState.plugins.plugins)) {
        for (const comp of install.manifest.components) {
          if (comp.id === overlayInfo.componentId) {
            dataVarNames.push(...(comp.overlayIracingSettings?.dataVariablesUsed ?? []))
          }
        }
      }
      this.sessionManager.registerComponentDataVars(ouid, dataVarNames)
    })
  }
}

export default OverlayManager
