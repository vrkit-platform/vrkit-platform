import { getLogger } from "@3fv/logger-proxy"

import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { DashboardConfig, OverlayKind, OverlayPlacement } from "vrkit-models"
import { isFunction } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import { assign, isDev, isNotEmpty, Pair } from "vrkit-app-common/utils"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron"
import { Deferred } from "@3fv/deferred"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  OverlayConfig,
  OverlayManagerEventType,
  OverlaySessionData
} from "vrkit-app-common/models/overlay-manager"
import { resolveHtmlPath, windowOptionDefaults } from "../../utils"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import {
  ActiveSessionType,
  SessionDataVariableValue,
  SessionDetail,
  SessionManagerEventType,
  SessionManagerState
} from "vrkit-app-common/models/session-manager"
import { SessionDataVariable, SessionDataVariableType } from "vrkit-native-interop"
import { pick, range } from "lodash"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export type OverlayManagerStatePatchFn = (state: OverlayManagerState) => Partial<OverlayManagerState>

export class OverlayWindow {
  private readonly window_: BrowserWindow

  private readonly config_: OverlayConfig

  private readonly readyDeferred_ = new Deferred<OverlayWindow>()

  private closeDeferred: Deferred<void> = null

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

  private constructor(placement: OverlayPlacement) {
    const { overlay } = placement

    this.config_ = { overlay, placement }
    this.window_ = new BrowserWindow({
      ...windowOptionDefaults({
        devTools: isDev
      }),
      transparent: true, // backgroundColor:
      // "#00000000"
      show: false,
      backgroundColor: "transparent"
    })

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

      win.on("ready-to-show", () => {
        win.show()
      })

      win.on("show", () => {
        deferred.resolve(this)
      })

      await win.loadURL(url)

      if (isDev) {
        win.webContents.openDevTools({
          mode: "detach"
        })
      }

      await deferred.promise
    } catch (err) {
      log.error(`Failed to initialize overlay window`, err)
      deferred.reject(err)
    }
    return deferred.promise
  }

  static create(placement: OverlayPlacement): OverlayWindow {
    return new OverlayWindow(placement)
  }
}

export interface OverlayManagerEventArgs {
  [OverlayManagerEventType.STATE_CHANGED]: (manager: OverlayManager, newState: OverlayManagerState) => void

  // [OverlayManagerEventType.CREATED]: (
  //   manager: OverlayManager,
  //   overlay: OverlayWindow
  // ) => void
  //
  // [OverlayManagerEventType.REMOVED]: (
  //   manager: OverlayManager,
  //   overlay: OverlayWindow
  // ) => void
  //
  // [OverlayManagerEventType.BOUNDS_CHANGED]: (
  //   manager: OverlayManager,
  //   overlay: OverlayWindow,
  //   bounds: Rectangle
  // ) => void
}

const DashboardTrackMapMockConfig: DashboardConfig = {
  id: "DefaultDashboardConfig",
  name: "DefaultDashboardConfig",
  description: "Default",
  screenId: "screen0", // TODO: implement or remove
  // screen: {
  //
  // },
  placements: [
    {
      id: "track-map-placement-0",
      overlay: {
        id: "track-map-0",
        kind: OverlayKind.TRACK_MAP,
        name: "track-map-0",
        description: "Default"
      },
      rect: {
        size: {
          width: 400,
          height: 400
        },
        position: {
          x: 0,
          y: 0
        }
      }
    }
  ]
}

export interface OverlayManagerState {
  config: DashboardConfig

  activeSessionId: string

  overlays: OverlayWindow[]
}

function newOverlayManagerState(): OverlayManagerState {
  return {
    config: DashboardTrackMapMockConfig,
    activeSessionId: null,
    overlays: []
  }
}

@Singleton()
export class OverlayManager extends EventEmitter3<OverlayManagerEventArgs> {
  private state_ = newOverlayManagerState()

  get state() {
    return this.state_
  }

  get overlays() {
    return this.state.overlays ?? []
  }

  getOverlayByWindowId(windowId: number) {
    return this.overlays.find(overlay => overlay.windowId === windowId)
  }

  async closeAll(skipPatch = false): Promise<void> {
    await Promise.all(this.overlays.map(overlay => overlay.close()))

    if (!skipPatch) {
      this.patchState({
        overlays: []
      })
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
      const { config } = this.state
      asOption(config.placements.map(placement => OverlayWindow.create(placement)))
        .filter(isNotEmpty)
        .ifSome(newOverlays => overlays.push(...newOverlays))
    }

    this.patchState({
      activeSessionId: activeSession?.id,
      overlays
    })

    if (overlays.length) await Promise.all(overlays.map(overlay => overlay.whenReady()))

    this.broadcastRendererOverlays(OverlayClientEventType.SESSION_INFO, activeSession?.id, activeSession?.info)
  }

  private async onActiveSessionChangedEvent(
    activeSessionType: ActiveSessionType,
    activeSession: SessionDetail,
    _newState: SessionManagerState
  ) {
    await this.updateActiveSession(activeSessionType, activeSession)
  }

  private onSessionStateChangedEvent(_newState: SessionManagerState) {
    this.broadcastRendererOverlays(OverlayClientEventType.SESSION_INFO, this.sessionManager.activeSession?.info)
  }

  private onSessionDataFrameEvent(sessionId: string, dataVars: SessionDataVariable[]) {
    const values = dataVars.map(dataVar => {
      const { type } = dataVar
      return {
        ...pick(dataVar, "count", "valid", "name", "unit"),
        type,
        values: range(dataVar.count).map(idx =>
          type === SessionDataVariableType.Bool
            ? dataVar.getBool(idx)
            : type === SessionDataVariableType.Char
              ? dataVar.getChar(idx)
              : type === SessionDataVariableType.Bitmask
                ? dataVar.getBitmask(idx)
                : type === SessionDataVariableType.Float
                  ? dataVar.getFloat(idx)
                  : type === SessionDataVariableType.Double
                    ? dataVar.getDouble(idx)
                    : type === SessionDataVariableType.Int32
                      ? dataVar.getInt(idx)
                      : null
        )
      } as SessionDataVariableValue<any>
    })

    this.broadcastRendererOverlays(OverlayClientEventType.DATA_FRAME, sessionId, this.sessionManager.activeSession?.info, values)
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

  async fetchOverlayConfigHandler(event: IpcMainInvokeEvent): Promise<OverlayConfig> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.state.overlays.find(it => it.window?.id === windowId)

    return overlayWindow?.config
  }

  async fetchSessionHandler(event: IpcMainInvokeEvent): Promise<OverlaySessionData> {
    const window = BrowserWindow.fromWebContents(event.sender),
      windowId = window.id,
      overlayWindow = this.state.overlays.find(it => it.window?.id === windowId),
      session = this.sessionManager.activeSession

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

    return asOption(this.state.overlays.find(it => it.window?.id === windowId)).match({
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
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    const ipcFnHandlers = Array<Pair<OverlayClientFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
      [OverlayClientFnType.FETCH_CONFIG, this.fetchOverlayConfigHandler.bind(this)],
      [OverlayClientFnType.FETCH_SESSION, this.fetchSessionHandler.bind(this)],
      [OverlayClientFnType.CLOSE, this.closeHandler.bind(this)]
    )

    app.on("before-quit", this.unload)

    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayClientFnTypeToIPCName(type), handler))

    // In dev mode, make everything accessible
    if (isDev) {
      Object.assign(global, {
        overlayManager: this
      })

      if (module.hot) {
        module.hot.addDisposeHandler(() => {
          app.off("before-quit", this.unload)
          ipcFnHandlers.forEach(([type]) => ipcMain.removeHandler(OverlayClientFnTypeToIPCName(type)))

          Object.assign(global, {
            overlayManager: undefined
          })
        })
      }
    }

    const { sessionManager } = this
    sessionManager.on(SessionManagerEventType.ACTIVE_SESSION_CHANGED, this.onActiveSessionChangedEvent.bind(this))
    sessionManager.on(SessionManagerEventType.STATE_CHANGED, this.onSessionStateChangedEvent.bind(this))
    sessionManager.on(SessionManagerEventType.DATA_FRAME, this.onSessionDataFrameEvent.bind(this))
  }

  /**
   * Service constructor
   *
   * @param container
   * @param sessionManager
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly sessionManager: SessionManager
  ) {
    super()
  }

  /**
   * Merge & patch OverlayManagerState slice
   */

  private patchState(newStateOrFn: Partial<OverlayManagerState> | OverlayManagerStatePatchFn = {}): void {
    const currentState = this.state_
    let newState = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn

    newState = assign(this.state_, newState)

    this.broadcastMainStateChanged()
  }

  /**
   * Broadcast a state change
   *
   * @private
   */
  private broadcastMainStateChanged() {
    this.broadcastMain(OverlayManagerEventType.STATE_CHANGED, this.state_)
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

  private broadcastRendererOverlays(type: OverlayClientEventType, ...args: any[]): void {
    const ipcEventName = OverlayClientEventTypeToIPCName(type)
    this.overlays.forEach(overlay => {
      overlay.window?.webContents?.send(ipcEventName, ...args)
    })
    // webContents.getAllWebContents().forEach(wc => {
    //   wc.send(ipcEventName, ...args)
    // })
  }
}

export default OverlayManager
