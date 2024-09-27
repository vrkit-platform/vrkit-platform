import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { APP_STORE_ID, isDev } from "../../constants"

import EventEmitter3 from "eventemitter3"
import { assign, isEqual, Pair } from "vrkit-app-common/utils"
import {
  OverlayClientEventArgs,
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  OverlayManagerState,
  
  OverlayMode,
  OverlaySessionData
} from "vrkit-app-common/models/overlay-manager"
import { PluginClientEventType, type SessionInfoMessage } from "vrkit-plugin-sdk"
import {
  DashboardConfig,
  OverlayConfig,
  SessionDataVariableValueMap,
  SessionTiming
} from "vrkit-models"
import { isFunction } from "@3fv/guard"
import type { AppStore } from "../store"
import { sharedAppActions } from "../store/slices/shared-app"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


/**
 * State patcher
 */
export type OverlayManagerStatePatchFn = (state: OverlayManagerState) => Partial<OverlayManagerState>

@Singleton()
export class OverlayClient extends EventEmitter3<OverlayClientEventArgs> {
  // private state_: OverlayManagerState = {
  //   // config: null,
  //   session: null,
  //   // mode: OverlayMode.NORMAL
  // }
  get state(): OverlayManagerState {
    return this.appStore.getState().shared.overlayManager
  }
  
  get sessionData() {
    return this.state?.session
  }

  get dashboardConfigs() {
    return this.state?.dashboardConfigs
  }
  
  get overlayConfig() {
    return this.state?.overlayConfig
  }

  get mode() {
    return this.state.overlayMode
  }

  /**
   * Merge & patch OverlayManagerState slice
   */

  private patchState(newStateOrFn: Partial<OverlayManagerState> | OverlayManagerStatePatchFn = {}): OverlayManagerState {
    const currentState = this.state
    const patch = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn
    const oldState = {...this.state}
    this.appStore.dispatch(sharedAppActions.patch(state => ({...patch})))
    // const newState = this.state_ = {...this.state_, ...patch}
    
    // TODO: make sure this still works without STATE_CHANGED event
    const newState = this.state
    if (!isEqual(oldState, newState)) {
      this.emit(OverlayClientEventType.STATE_CHANGED, newState)
    }

    return newState
  }

  /**
   * On overlay mode changed
   *
   * @param _event
   * @param mode
   */
  private onOverlayModeEvent(_event: IpcRendererEvent, mode: OverlayMode) {
    // if (mode === this.mode) return

    this.patchState({
      overlayMode: mode
    })

    this.emit(OverlayClientEventType.OVERLAY_MODE, mode)
  }

  /**
   * On overlay config changed
   *
   * @param _event
   * @param configJs
   */
  private onOverlayConfigEvent(_event: IpcRendererEvent, configJs: OverlayConfig) {
    const config = OverlayConfig.fromJson(configJs as any);
    this.patchState({
      overlayConfig: config
    })
    
    this.emit(OverlayClientEventType.OVERLAY_CONFIG, config)
  }

  /**
   * On session info changed
   *
   * @param _event
   * @param sessionId
   * @param info
   */
  private onSessionInfoEvent(_event: IpcRendererEvent, sessionId: string, info: SessionInfoMessage) {
    this.patchState({
      session: {
        ...this.state.session,
        info,
        id: sessionId
      }
    })

    this.emit(PluginClientEventType.SESSION_INFO, sessionId, info)
  }

  /**
   * Handles events when a new data frame is received. This method processes
   * the incoming event data and emits a corresponding event to notify other
   * parts of the application.
   *
   * @param _event - The IPC renderer event triggering this callback.
   * @param sessionId - The ID of the session associated with the data frame.
   * @param timing - Timing information for the session.
   * @param dataVarValues - A map of data variable values for the session.
   * @return void
   */
  private onDataFrameEvent(
    _event: IpcRendererEvent,
    sessionId: string,
    timing: SessionTiming,
    dataVarValues: SessionDataVariableValueMap
  ) {
    this.emit(PluginClientEventType.DATA_FRAME, sessionId, timing, dataVarValues)
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading overlay manager client`)

    // TODO: Unsubscribe from ipcRenderer
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  // tslint:disable-next-line
  private async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    const ipcEventHandlers = Array<
      Pair<OverlayClientEventType | PluginClientEventType, (event: IpcRendererEvent, ...args: any[]) => any>
    >(
      [OverlayClientEventType.OVERLAY_CONFIG, this.onOverlayConfigEvent.bind(this)],
      [OverlayClientEventType.OVERLAY_MODE, this.onOverlayModeEvent.bind(this)],
      [PluginClientEventType.SESSION_INFO, this.onSessionInfoEvent.bind(this)],
      [PluginClientEventType.DATA_FRAME, this.onDataFrameEvent.bind(this)]
    )

    ipcEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(OverlayClientEventTypeToIPCName(type), handler)
    })

    if (isDev) {
      Object.assign(global, {
        overlayClient: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            overlayClient: null
          })

          ipcEventHandlers.forEach(([type, handler]) => {
            ipcRenderer.off(OverlayClientEventTypeToIPCName(type), handler)
          })
        })
      }
    }

    const [config, session, mode] = await Promise.all([this.fetchOverlayConfig(), this.fetchSession(), this.fetchMode()])
    //debugger
    this.patchState({
      overlayConfig:config,
      session,
      overlayMode:mode
    })

    // await this.loadOverlay()
    //     .catch(err => error(`Failed to load overlay`, err))
  }

  // private async loadOverlay() {
  //   const { config } = this
  //   if (config.overlay.kind === OverlayKind.CUSTOM) {
  //     throw Error(`NotImplemented yet, will be part of plugin system`)
  //   }
  //
  // }

  /**
   * Service constructor
   *
   */
  constructor(@Inject(APP_STORE_ID) readonly appStore: AppStore) {
    super()
  }

  @Bind
  async fetchOverlayConfig(): Promise<OverlayConfig> {
    const newConfig = OverlayConfig.fromJson(await ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.FETCH_CONFIG)))
    this.patchState({
      overlayConfig: newConfig
    })
    return newConfig
  }

  @Bind
  async fetchSession(): Promise<OverlaySessionData> {
    const newSession = await ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.FETCH_SESSION))
    this.patchState({
      session: newSession
    })
    return newSession
  }

  @Bind
  async fetchMode(): Promise<OverlayMode> {
    const mode = await ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.FETCH_OVERLAY_MODE))
    // if (mode === this.state_?.mode) return mode

    this.patchState({
      overlayMode: mode
    })

    return mode
  }
  
  @Bind
  async setMode(mode: OverlayMode): Promise<OverlayMode> {
    if (mode === this.state?.overlayMode) return mode
    const newMode = await ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.SET_OVERLAY_MODE), mode)
    
    return this.patchState({
      overlayMode:newMode
    })?.overlayMode
  }

  @Bind close(): Promise<void> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.CLOSE))
  }
  
  updateDashboardConfig(id: string, patch:Partial<DashboardConfig>):Promise<DashboardConfig> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.UPDATE_DASHBOARD_CONFIG), id, patch)
  }
  
  launchLayoutEditor(id: string): Promise<DashboardConfig> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.LAUNCH_DASHBOARD_LAYOUT_EDITOR), id)
  }
}

export default OverlayClient
