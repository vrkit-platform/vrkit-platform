import { getLogger } from "@3fv/logger-proxy"
import { BrowserWindowConstructorOptions, IpcMainInvokeEvent } from "electron"
import { OverlayConfig, OverlayInfo, OverlayPlacement, RectI } from "@vrkit-platform/models"
import { Deferred } from "@3fv/deferred"
import {
  assign,
  isEditorInfoOUID,
  OverlayBrowserWindowType,
  OverlayClientEventTypeToIPCName,
  overlayInfoToUniqueId,
  OverlayManagerClientEventType,
  OverlayManagerClientFnType,
  OverlayManagerClientFnTypeToIPCName,
  overlayPlacementToJson,
  OverlaySpecialIds,
  OverlayWindowRole, WindowConfig,
  WindowRole
} from "@vrkit-platform/shared"
import { resolveHtmlPath } from "../../utils"
import type OverlayManager from "./OverlayManager"
import { asOption } from "@3fv/prelude-ts"
import EventEmitter3 from "eventemitter3"

import { adjustScreenRect, MaxOverlayWindowDimension, MaxOverlayWindowDimensionPadding } from "./OverlayLayoutTools"
import { runInAction } from "mobx"
import { newWindowCreateOptions, WindowMainInstance, WindowManager } from "../window-manager" // TypeScriptUnresolvedVariable
import { match } from "ts-pattern"
import { guard } from "@3fv/guard"

// TypeScriptUnresolvedVariable

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const MaxFPSIntervalMillis = Math.floor(1000 / 10)

export enum OverlayBrowserWindowEvent {
  Created = "Created",
  Ready = "Ready"
}

export interface OverlayBrowserWindowEventArgs {
  [OverlayBrowserWindowEvent.Created]: (overlayWin: OverlayBrowserWindow) => any
  [OverlayBrowserWindowEvent.Ready]: (overlayWin: OverlayBrowserWindow) => any
}

export class OverlayBrowserWindow extends EventEmitter3<OverlayBrowserWindowEventArgs> {
  #invalidateInterval_: NodeJS.Timeout

  #windowInstance_: WindowMainInstance

  readonly #windowInstancePromise: Promise<WindowMainInstance>

  private readonly config_: OverlayConfig

  private readonly readyDeferred_ = new Deferred<OverlayBrowserWindow>()

  private readonly uniqueId_: string

  private previousInvalidateTime_: number = 0

  private closeDeferred_: Deferred<void> = null

  private wasMovedManually_: boolean = false
  
  get isBrowserWindowActive():boolean {
    return [!(this.browserWindow?.isDestroyed() ?? true), this.browserWindow?.isClosable() ?? false].every(it => it === true)
  }

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

  //readonly windowOptions: BrowserWindowConstructorOptions
  readonly windowConfig: WindowConfig

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
  get browserWindow() {
    return this.#windowInstance_?.browserWindow
  }

  get browserWindowId() {
    return this.browserWindow?.id
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
    this.stopInvalidateInterval()

    try {
      if (this.browserWindow && !this.browserWindow.isDestroyed()  && this.browserWindow.isClosable())
        this.browserWindow.close()
      deferred.resolve()
    } catch (err) {
      log.error(`Unable to close window`, err)
      // deferred.reject(err)
      deferred.resolve()
    }
    return deferred.promise
  }

  get config() {
    return this.config_
  }

  get placement() {
    return this.config.placement
  }
  
  /**
   * Waits until the OverlayBrowserWindow is fully initialized and ready for
   * use.
   *
   * This method ensures that any asynchronous processes required to set up the
   * OverlayBrowserWindow are completed before proceeding. It resolves once the
   * window instance is ready.
   *
   * @return {Promise<OverlayBrowserWindow>} A promise that resolves to the
   *     initialized OverlayBrowserWindow.
   */
  whenReady(): Promise<OverlayBrowserWindow> {
    log.assert(!!this.#windowInstancePromise, "Window instance promise is not set")
    return this.#windowInstancePromise.then(() => this.readyDeferred_.promise)
  }

  get ready() {
    log.assert(!!this.#windowInstancePromise, "Window instance promise is not set")
    
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
    this.browserWindow?.webContents?.send(
      OverlayClientEventTypeToIPCName(OverlayManagerClientEventType.OVERLAY_CONFIG),
      this.config
    )
  }

  private async fetchConfigHandler(event: IpcMainInvokeEvent) {
    log.info(`FETCH_CONFIG_HANDLER`, this.config)
    return {
      overlay: OverlayInfo.toJson(this.config.overlay),
      placement: overlayPlacementToJson(this.config.placement)
    }
  }

  private constructor(
    readonly manager: OverlayManager,
    readonly windowManager: WindowManager,
    readonly kind: OverlayBrowserWindowType,
    overlay: OverlayInfo,
    placement: OverlayPlacement
  ) {
    super()
    const deferred = this.readyDeferred_
    const handleError = (err: Error) => {
      log.error(`Failed to create window`, err)

      if (!deferred.isSettled()) {
        deferred.reject(err)
      }

      throw err
    }

    try {
      this.config_ = {
        isScreen: kind === OverlayBrowserWindowType.SCREEN,
        overlay,
        placement
      }

      this.uniqueId_ = overlayInfoToUniqueId(this.config.overlay, this.kind)
      this.#invalidateInterval_ = setInterval(() => {
        this.invalidate()
      }, MaxFPSIntervalMillis)

      const baseWindowOpts: Partial<BrowserWindowConstructorOptions> = match(this.isVR)
        .with(true, () => ({ webPreferences: { offscreen: true } }))
        .otherwise(() => ({
          webPreferences: { transparent: true },
          transparent: true,
          alwaysOnTop: true
        }))

      const windowOpts = runInAction(() => {
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

        return assign(baseWindowOpts, {
          ...screenRect.position,
          ...screenRect.size,
          maxWidth: MaxOverlayWindowDimension - MaxOverlayWindowDimensionPadding,
          maxHeight: MaxOverlayWindowDimension - MaxOverlayWindowDimensionPadding
        })
      })

      const windowConfig = newWindowCreateOptions(WindowRole.Overlay, {
        id: this.uniqueId,
        browserWindowOptions: windowOpts,
        onBrowserWindowEvent: (type, bw, winInstance) => {
          info(`onBrowserWindowEvent(type=${type}) triggered`)
          match(type)
              .with("Created", this.newWindowCreatedHandler(bw, winInstance))
              .with("Ready", this.newWindowReadyHandler(bw, winInstance))
              .otherwise(type => warn(`Unknown WindowInstance event ${type}`))
        },

        url: `${resolveHtmlPath("index-overlay.html")}#${this.uniqueId}`
      })

      this.#windowInstancePromise = this.windowManager.create(windowConfig)
          .then(wi => {
            if (!deferred.isSettled())
              deferred.resolve(this)
            
            if (deferred.isRejected())
              throw deferred.error
            
            this.emit(OverlayBrowserWindowEvent.Ready, this)
            return wi
          })
          .catch(handleError)
      // this.initialize(this.windowManager.create(windowConfig)).catch(err => {
      //   log.error(`failed to initialize overlay window`, err)
      // })
    } catch (err) {
      log.error(`Failed to create window`, err)
      deferred.reject(err)
    }
  }

  
  /**
   * Create a new overlay window
   *
   * @param manager
   * @param windowManager
   * @param kind
   * @param overlay
   * @param placement
   */
  static create(
    manager: OverlayManager,
    windowManager: WindowManager,
    kind: OverlayBrowserWindowType,
    overlay: OverlayInfo,
    placement: OverlayPlacement
  ): OverlayBrowserWindow {
    return new OverlayBrowserWindow(manager, windowManager, kind, overlay, placement)
  }

  private setIgnoreMouseEvents(ignore: boolean): void {
    if (ignore) {
      this.browserWindow?.setIgnoreMouseEvents(true, {
        forward: true
      })
    } else {
      this.browserWindow?.setIgnoreMouseEvents(false)
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
    if (now - this.previousInvalidateTime_ < MaxFPSIntervalMillis) {
      return
    }
    
    if (!this.isBrowserWindowActive) {
      this.stopInvalidateInterval()
      return
    }
    
    this.previousInvalidateTime_ = now
    guard(
      () => this.browserWindow?.webContents?.invalidate(),
      err => {
        log.warn(`Failed to invalidate overlay window (${this.uniqueId})`, err)
      }
    )
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
    this.browserWindow?.setBounds(newBounds)
  }
  
  private newWindowCreatedHandler(
      bw:Electron.BrowserWindow,
      winInstance:WindowMainInstance
  ) {
    return () => {
      try {
        // SET THE WINDOW INSTANCE REF FIRST
        this.#windowInstance_ = winInstance
        
        bw.setTitle(this.uniqueId)
        
        bw.webContents.ipc.handle(
            OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.FETCH_CONFIG),
            this.fetchConfigHandler.bind(this)
        )
        
        this.emit(OverlayBrowserWindowEvent.Created, this)
      } catch (err) {
        log.error(`failed to initialize overlay window`, err)
        if (!this.readyDeferred_.isSettled()) this.readyDeferred_.reject(err)
      }
    }
  }
  
  
  private newWindowReadyHandler(
      bw:Electron.BrowserWindow,
      winInstance:WindowMainInstance
  ) {
    return () => {
      const deferred = this.readyDeferred_
      try {
        runInAction(() => {
          this.setEditorEnabled(this.manager.editorEnabled)
        })
        
        info(
            `Loaded overlay (id=${winInstance.id},url=${winInstance.config.url}) for overlayWindow(${this.uniqueIdDebugString})`
        )
        
        if (this.isVR) {
          // CONFIGURE THE `webContents` OF THE NEW WINDOW
          info(`VR Windows are not shown as they render offscreen for performance (${this.uniqueIdDebugString})`)
          bw.webContents.on("paint", this.manager.createOnPaintHandler(this))
              .setFrameRate(this.config.overlay.settings?.fps ?? 10)
          bw.webContents.startPainting()
        }
        if (this.isScreen) {
          info(`Showing window in SCREEN kind (${this.uniqueIdDebugString})`)
        }
        
        if (!deferred.isSettled())
          deferred.resolve(this)
      } catch (err) {
        log.error(`failed to initialize overlay window`, err)
        if (!deferred.isSettled())
          deferred.reject(err)
      }
    }
  }
  
  private stopInvalidateInterval():void {
    if (this.#invalidateInterval_) {
      clearInterval(this.#invalidateInterval_)
      this.#invalidateInterval_ = null
    }
  }
}
