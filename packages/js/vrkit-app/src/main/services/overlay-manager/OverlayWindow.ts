import { getLogger } from "@3fv/logger-proxy"
import { BrowserWindow, BrowserWindowConstructorOptions, ipcMain, IpcMainEvent } from "electron"
import { Bind } from "vrkit-app-common/decorators"
import { OverlayInfo, OverlayPlacement } from "vrkit-models"
import { isDev } from "vrkit-app-common/utils"
import { Deferred } from "@3fv/deferred"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayConfig,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents
} from "vrkit-app-common/models/overlay-manager"
import { resolveHtmlPath, windowOptionDefaults } from "../../utils"
import { AppPaths } from "vrkit-app-common/constants"
// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

export class OverlayWindow {
  private focused_: boolean = false

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
  }

  @Bind
  private onIPCMouseLeave(ev: IpcMainEvent) {
    const fromWin = BrowserWindow.fromWebContents(ev?.sender)
    if (fromWin?.id !== this.window_?.id) {
      return
    }
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
    this.setFocused(false)

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

  setFocused(focused: boolean): void {
    if ((focused && this.focused_) || (!focused && !this.focused_)) return

    this.focused_ = focused
    this.setIgnoreMouseEvents(!focused)
    this.window.webContents.send(
      OverlayWindowMainEvents.EventTypeToIPCName(OverlayWindowMainEvents.EventType.FOCUSED),
      focused
    )
  }
}