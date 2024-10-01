import { getLogger } from "@3fv/logger-proxy"
import {
  BrowserWindow,
  BrowserWindowConstructorOptions, WebPreferences
} from "electron"
import { OverlayConfig, OverlayInfo, OverlayPlacement, RectI } from "vrkit-models"
import { isDev, isRectValid } from "vrkit-app-common/utils"
import { Deferred } from "@3fv/deferred"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayMode
} from "../../../common/models/overlays"
import { resolveHtmlPath, windowOptionDefaults } from "../../utils"
import type OverlayManager from "./OverlayManager"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export enum OverlayBrowserWindowKind {
  SCREEN = "SCREEN",
  VR = "VR"
}

export class OverlayBrowserWindow {
  private mode_: OverlayMode = OverlayMode.NORMAL

  private focused_: boolean = false

  private readonly window_: BrowserWindow

  private readonly config_: OverlayConfig

  private readonly readyDeferred_ = new Deferred<OverlayBrowserWindow>()

  private closeDeferred: Deferred<void> = null

  readonly windowOptions: BrowserWindowConstructorOptions

  get id() {
    return this.config_?.overlay.id
  }

  get uniqueId() {
    return `${this.id}::${this.kind}`
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
    return !!this.closeDeferred
  }

  get isClosed() {
    return this.isClosing && this.closeDeferred.isSettled()
  }

  get mode() {
    return this.mode_
  }

  /**
   * Close the window
   */
  close(): Promise<void> {
    if (this.closeDeferred) {
      return this.closeDeferred.promise
    }

    const deferred = (this.closeDeferred = new Deferred())

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
    if (this.readyDeferred_.isRejected()) throw this.readyDeferred_.error ?? Error(`Failed to reach ready state`)

    return this.readyDeferred_.isSettled()
  }
  
  get isVR() {
    return this.kind === OverlayBrowserWindowKind.VR
  }
  
  get isScreen() {
    return !this.isVR
  }

  sendConfig() {
    log.info(`Sending overlay config`, this.config?.overlay?.id)
    this.window?.webContents?.send(OverlayClientEventTypeToIPCName(OverlayClientEventType.OVERLAY_CONFIG), this.config)
  }

  private constructor(readonly manager: OverlayManager, readonly kind: OverlayBrowserWindowKind, overlay: OverlayInfo, placement: OverlayPlacement) {
    this.config_ = { overlay, placement }
    const screenRect = this.isScreen ? placement.screenRect : placement.vrLayout.screenRect
    
    const extraWebPrefs: Partial<WebPreferences> = this.isVR ? {
      offscreen: true
    } : {
      transparent: true,
    }
    
    
    this.windowOptions = {
      ...windowOptionDefaults({
        devTools: isDev,
        ...extraWebPrefs
      }),
      transparent: this.isScreen,
      show: false,
      frame: false,
      backgroundColor: "#00000000",
      alwaysOnTop: this.isScreen,
      ...screenRect.position,
      ...screenRect.size
    }

    this.window_ = new BrowserWindow(this.windowOptions)

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
      info(`Resolved overlay url: ${url}`)
      
      await win.loadURL(url)
      info(`Loaded overlay url(${url}) for overlayWindow(${this.uniqueIdDebugString})`)
      if (this.isScreen) {
        info(`Showing window in SCREEN kind (${this.uniqueIdDebugString})`)
        win.show()
      } else {
        info(`VR Windows are not shown as they render offscreen for performance (${this.uniqueIdDebugString})`)
      }
      
      if (isDev) {
        info(`Showing devtools`)
        win.webContents.openDevTools({
          mode: "detach"
        })
        info(`Shown devtools`)
      }
      
      
      deferred.resolve(this)

      await deferred.promise
    } catch (err) {
      log.error(`Failed to initialize overlay window`, err)
      deferred.reject(err)
    }
    return deferred.promise
  }

  static create(manager: OverlayManager, kind: OverlayBrowserWindowKind,overlay: OverlayInfo, placement: OverlayPlacement): OverlayBrowserWindow {
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

  setFocused(focused: boolean) {
    this.focused_ = focused
  }

  setMode(mode: OverlayMode): void {
    if (mode === this.mode) return

    this.mode_ = mode
    this.setIgnoreMouseEvents(mode !== OverlayMode.EDIT)
  }
}
