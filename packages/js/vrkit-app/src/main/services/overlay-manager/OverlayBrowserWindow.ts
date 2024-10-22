import { getLogger } from "@3fv/logger-proxy"
import { BrowserWindow, BrowserWindowConstructorOptions, IpcMainInvokeEvent, WebPreferences } from "electron"
import { OverlayConfig, OverlayInfo, OverlayPlacement, RectI } from "vrkit-models"
import { isDev } from "vrkit-shared"
import { Deferred } from "@3fv/deferred"
import {
  isEditorInfoOUID,
  OverlayBrowserWindowType,
  OverlayClientEventTypeToIPCName,
  overlayInfoToUniqueId,
  OverlayManagerClientEventType,
  OverlayManagerClientFnType,
  OverlayManagerClientFnTypeToIPCName,
  OverlaySpecialIds,
  OverlayWindowRole
} from "vrkit-shared"
import { resolveHtmlPath, windowOptionDefaults } from "../../utils"
import type OverlayManager from "./OverlayManager"
import { asOption, Option } from "@3fv/prelude-ts"

import { adjustScreenRect, MaxOverlayWindowDimension, MaxOverlayWindowDimensionPadding } from "./OverlayLayoutTools"

// TypeScriptUnresolvedVariable

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const MaxFPSIntervalMillis = Math.floor(1000 / 10)

export class OverlayBrowserWindow {
  private invalidateInterval_: NodeJS.Timeout

  private readonly window_: BrowserWindow

  private readonly config_: OverlayConfig

  private readonly readyDeferred_ = new Deferred<OverlayBrowserWindow>()

  private readonly uniqueId_: string

  private previousInvalidateTime_: number = 0

  private closeDeferred_: Deferred<void> = null

  private wasMovedManually_: boolean = false

  get wasMovedManually(): boolean {
    return this.wasMovedManually_
  }

  get role(): OverlayWindowRole {
    return this.config.overlay.id === OverlaySpecialIds.EDITOR_INFO
      ? OverlayWindowRole.EDITOR_INFO
      : this.config.overlay.id === OverlaySpecialIds.EDITOR_INFO
        ? OverlayWindowRole.EDITOR_INFO
        : OverlayWindowRole.OVERLAY
  }

  readonly windowOptions: BrowserWindowConstructorOptions

  get id() {
    return this.config_?.overlay.id
  }

  get uniqueId() {
    return this.uniqueId_
  }

  get uniqueIdDebugString() {
    return `uniqueId=${this.uniqueId},id=${this.id},kind=${this.kind}`
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

  get screenRect(): RectI {
    return this.manager.getOverlayScreenRect(this)
  }

  get isClosing() {
    return !!this.closeDeferred_
  }

  get isClosed() {
    return this.isClosing && this.closeDeferred_.isSettled()
  }

  get isEditorInfo() {
    return isEditorInfoOUID(this.uniqueId)
  }

  get editorController() {
    return this.manager.editorController
  }

  setMovedManually(wasMovedManually: boolean) {
    this.wasMovedManually_ = wasMovedManually
  }

  /**
   * Close the window
   */
  close(): Promise<void> {
    if (this.closeDeferred_) {
      return this.closeDeferred_.promise
    }

    const deferred = (this.closeDeferred_ = new Deferred())
    if (this.invalidateInterval_) {
      clearInterval(this.invalidateInterval_)
      this.invalidateInterval_ = null
    }

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

  get placement() {
    return this.config.placement
  }

  whenReady(): Promise<OverlayBrowserWindow> {
    return this.readyDeferred_.promise
  }

  get ready() {
    if (this.readyDeferred_.isRejected()) {
      throw this.readyDeferred_.error ?? Error(`Failed to reach ready state`)
    }

    return this.readyDeferred_.isSettled()
  }

  get isVR() {
    return !this.config.isScreen
  }

  get isScreen() {
    return this.config.isScreen
  }

  sendConfig() {
    log.info(`Sending overlay config`, this.config?.overlay?.id)
    this.window?.webContents?.send(
      OverlayClientEventTypeToIPCName(OverlayManagerClientEventType.OVERLAY_CONFIG),
      this.config
    )
  }

  private async fetchConfigHandler(event: IpcMainInvokeEvent) {
    log.info(`FETCH_CONFIG_HANDLER`, this.config)
    return {
      overlay: OverlayInfo.toJson(this.config.overlay),
      placement: OverlayPlacement.toJson(this.config.placement)
    }
  }

  private constructor(
    readonly manager: OverlayManager,
    readonly kind: OverlayBrowserWindowType,
    overlay: OverlayInfo,
    placement: OverlayPlacement
  ) {
    this.config_ = {
      isScreen: kind === OverlayBrowserWindowType.SCREEN,
      overlay,
      placement
    }
    this.uniqueId_ = overlayInfoToUniqueId(this.config.overlay, this.kind)
    this.invalidateInterval_ = setInterval(() => {
      this.invalidate()
    }, MaxFPSIntervalMillis)
    const screenRect: RectI = this.isEditorInfo
      ? this.isVR
        ? placement.vrLayout.screenRect
        : placement.screenRect
      : this.isScreen
        ? adjustScreenRect(placement.screenRect)
        : asOption(placement.vrLayout.screenRect)
            .map(adjustScreenRect)
            .getOrCall(() => {
              const size = placement.vrLayout.size,
                aspectRatio = size.height / size.width,
                defaultWidth = 200

              placement.vrLayout.screenRect = {
                size: {
                  width: defaultWidth,
                  height: defaultWidth * aspectRatio
                },
                position: { x: 0, y: 0 }
              }

              return adjustScreenRect(placement.vrLayout.screenRect)
            })

    const extraWebPrefs: Partial<WebPreferences> = this.isVR
      ? {
          offscreen: true
        }
      : {
          transparent: true
        }

    const extraWindowOpts = this.isVR
      ? {}
      : {
          transparent: true,
          alwaysOnTop: true
        }

    this.windowOptions = {
      ...windowOptionDefaults({
        devTools: isDev,
        ...extraWebPrefs
      }),
      ...extraWindowOpts,
      show: false,
      frame: false,
      backgroundColor: "#00000000",
      ...screenRect.position,
      ...screenRect.size,
      maxWidth: MaxOverlayWindowDimension - MaxOverlayWindowDimensionPadding,
      maxHeight: MaxOverlayWindowDimension - MaxOverlayWindowDimensionPadding
    }

    this.window_ = new BrowserWindow(this.windowOptions)
    this.window_.setTitle(this.uniqueId)

    this.window_.webContents.ipc.handle(
      OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.FETCH_CONFIG),
      this.fetchConfigHandler.bind(this)
    )

    this.setEditorEnabled(manager.editorEnabled)

    // The returned promise is tracked via `readyDeferred`
    this.initialize().catch(err => {
      log.error(`failed to initialize overlay window`, err)
    })
  }

  private async initialize(): Promise<OverlayBrowserWindow> {
    const deferred = this.readyDeferred_
    try {
      const win = this.window_
      const url = resolveHtmlPath("index-overlay.html")
      const urlWithHash = `${url}#${this.uniqueId}`
      info(`Resolved overlay url: ${url} with hash: ${urlWithHash}`)

      // await win.loadURL(url)
      await win.loadURL(urlWithHash)
      info(`Loaded overlay url(${url}) for overlayWindow(${this.uniqueIdDebugString})`)
      if (this.isScreen) {
        info(`Showing window in SCREEN kind (${this.uniqueIdDebugString})`)
        win.show()
      } else {
        info(`VR Windows are not shown as they render offscreen for performance (${this.uniqueIdDebugString})`)
        win.webContents.startPainting()
      }

      if (isDev && this.manager.mainAppState.devSettings.alwaysOpenDevTools) {
        win.webContents.openDevTools({
          mode: "detach"
        })
      }

      if (this.isVR) {
        // CONFIGURE THE `webContents` OF THE NEW WINDOW
        win.webContents.setFrameRate(this.config.overlay.settings?.fps ?? 10)
        win.webContents.on("paint", this.manager.createOnPaintHandler(this))
      }

      deferred.resolve(this)

      await deferred.promise
    } catch (err) {
      log.error(`Failed to initialize overlay window`, err)
      deferred.reject(err)
    }
    return deferred.promise
  }

  static create(
    manager: OverlayManager,
    kind: OverlayBrowserWindowType,
    overlay: OverlayInfo,
    placement: OverlayPlacement
  ): OverlayBrowserWindow {
    return new OverlayBrowserWindow(manager, kind, overlay, placement)
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

  /**
   * Set whether editor is enabled or not
   *
   * @param enabled
   */
  setEditorEnabled(enabled: boolean): void {
    this.setIgnoreMouseEvents(!enabled)
  }

  /**
   * Invalidate, which forces a repaint
   */
  invalidate(): void {
    const now = Date.now()
    if (now - this.previousInvalidateTime_ < MaxFPSIntervalMillis) return

    this.previousInvalidateTime_ = now
    Option.try(() => this.window_?.webContents?.invalidate())
  }

  /**
   * Explicitly set the window bounds
   *
   * @param rect
   */
  setBounds(rect: RectI): void {
    const newBounds: Electron.Rectangle = {
      ...rect.position,
      ...rect.size
    }

    log.info(`Setting new bounds`, newBounds)
    this.config_.placement.screenRect = rect
    this.window?.setBounds(newBounds)
  }
}
