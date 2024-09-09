import { getLogger } from "@3fv/logger-proxy"

import { PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { DashboardConfig, Overlay, OverlayPlacement } from "vrkit-models"
import { isFunction } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import { assign, isDev, Pair } from "vrkit-app-common/utils"
import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  Rectangle,
  webContents
} from "electron"
import { Deferred } from "@3fv/deferred"
import {
  OverlayConfig,
  OverlayManagerEventType,
  OverlayManagerEventTypeToIPCName,
  OverlayManagerFnType,
  OverlayManagerFnTypeToIPCName
} from "vrkit-app-common/models/overlay-manager"
import { windowOptionDefaults } from "../../utils"
import { SessionManager } from "../session-manager"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export type OverlayManagerStatePatchFn = (
  state: OverlayManagerState
) => Partial<OverlayManagerState>

export class OverlayWindow {
  private readonly window_: BrowserWindow
  private readonly config_: OverlayConfig
  private readonly readyDeferred_ = new Deferred<OverlayWindow>()

  get window() {
    return this.window_
  }

  get config() {
    return this.config_
  }

  get whenReady(): Promise<OverlayWindow> {
    return this.readyDeferred_.promise
  }

  get ready() {
    if (this.readyDeferred_.isRejected())
      throw this.readyDeferred_.error ?? Error(`Failed to reach ready state`)

    return this.readyDeferred_.isSettled()
  }

  private constructor(overlay: Overlay, placement: OverlayPlacement) {
    this.config_ = { overlay, placement }
    this.window_ = new BrowserWindow({
      ...windowOptionDefaults()
    })
  }
}

export interface OverlayManagerEventArgs {
  [OverlayManagerEventType.STATE_CHANGED]: (
    manager: OverlayManager,
    newState: OverlayManagerState
  ) => void
  [OverlayManagerEventType.CREATED]: (
    manager: OverlayManager,
    overlay: OverlayWindow
  ) => void

  [OverlayManagerEventType.REMOVED]: (
    manager: OverlayManager,
    overlay: OverlayWindow
  ) => void

  [OverlayManagerEventType.BOUNDS_CHANGED]: (
    manager: OverlayManager,
    overlay: OverlayWindow,
    bounds: Rectangle
  ) => void
}

export interface OverlayManagerState {
  config: DashboardConfig
  overlays: OverlayWindow[]
}

function newOverlayManagerState() {
  return {
    config: null,
    overlays: []
  }
}

@Singleton()
export class OverlayManager extends EventEmitter3<OverlayManagerEventArgs> {
  private state_ = newOverlayManagerState()

  get state() {
    return this.state_
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
  }

  async getOverlayConfigHandler(id: string): Promise<OverlayConfig> {
    return
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    const ipcFnHandlers = Array<
      Pair<
        OverlayManagerFnType,
        (event: IpcMainInvokeEvent, ...args: any[]) => any
      >
    >([
      OverlayManagerFnType.GET_OVERLAY_CONFIG,
      this.getOverlayConfigHandler.bind(this)
    ])

    app.on("before-quit", this.unload)

    ipcFnHandlers.forEach(([type, handler]) =>
      ipcMain.handle(OverlayManagerFnTypeToIPCName(type), handler)
    )

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })

      if (module.hot) {
        module.hot.addDisposeHandler(() => {
          app.off("before-quit", this.unload)
          ipcFnHandlers.forEach(([type]) =>
            ipcMain.removeHandler(OverlayManagerFnTypeToIPCName(type))
          )

          Object.assign(global, {
            overlayManager: undefined
          })
        })
      }
    }
  }

  /**
   * Service constructor
   *
   * @param appStore
   */
  constructor(readonly sessionManager: SessionManager) {
    super()
  }

  /**
   * Merge & patch OverlayManagerState slice
   */

  private patchState(
    newStateOrFn: Partial<OverlayManagerState> | OverlayManagerStatePatchFn = {}
  ): void {
    const currentState = this.state_
    const newState = isFunction(newStateOrFn)
      ? newStateOrFn(currentState)
      : newStateOrFn

    assign(this.state_, newState)
    this.broadcastState()
  }

  /**
   * Broadcast a state change
   *
   * @private
   */
  private broadcastState() {
    this.broadcast(OverlayManagerEventType.STATE_CHANGED, this.state_)
  }

  /**
   * Generate broadcast/emit function.  This emits via it's super
   * class `EventEmitter3` & sends it to all browser windows
   *
   * @param type
   * @param args
   * @private
   */
  private broadcast(type: OverlayManagerEventType, ...args: any[]): void {
    const ipcEventName = OverlayManagerEventTypeToIPCName(type)
    ;(this.emit as any)(type, ...args)

    webContents.getAllWebContents().forEach(wc => {
      wc.send(ipcEventName, ...args)
    })
  }
}

export default OverlayManager
