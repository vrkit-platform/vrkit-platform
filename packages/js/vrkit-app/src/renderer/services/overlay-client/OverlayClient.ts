import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { isDev } from "../../constants"

import EventEmitter3 from "eventemitter3"
import { assign, Pair } from "vrkit-app-common/utils"
import {
  OverlayConfig,
  OverlayManagerClientEventArgs,
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnTypeToIPCName,
  OverlaySessionData,
  OverlayClientFnType
} from "vrkit-app-common/models/overlay-manager"
import type { SessionDataVariable, SessionInfoMessage } from "vrkit-native-interop"
import { SessionTiming } from "vrkit-models"
import { isFunction } from "@3fv/guard"
import { SessionDataVariableValue } from "vrkit-app-common/models/session-manager"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


interface OverlayClientState {
  config: OverlayConfig
  session: OverlaySessionData
}

export type OverlayClientStatePatchFn = (state: OverlayClientState) => Partial<OverlayClientState>

@Singleton()
export class OverlayClient extends EventEmitter3<OverlayManagerClientEventArgs> {
  private state_: OverlayClientState = {
    config: null,
    session: null
  }

  /**
   * Merge & patch OverlayClientState slice
   */

  private patchState(newStateOrFn: Partial<OverlayClientState> | OverlayClientStatePatchFn = {}): void {
    const currentState = this.state_
    const newState = isFunction(newStateOrFn) ? newStateOrFn(currentState) : newStateOrFn

    assign(this.state_, newState)
  }

  get sessionData() {
    return this.state_.session
  }

  get config() {
    return this.state_.config
  }
  
  private onOverlayConfigEvent(_event: IpcRendererEvent, config: OverlayConfig) {
    this.patchState({
      config
    })
    
    this.emit(OverlayClientEventType.OVERLAY_CONFIG, config)
  }
  
  private onSessionInfoEvent(_event: IpcRendererEvent, sessionId: string, info: SessionInfoMessage) {
    this.patchState({
      session: {
        ...this.state_.session,
        info,
        id: sessionId
      }
    })

    this.emit(OverlayClientEventType.SESSION_INFO, sessionId, info)
  }

  
  private onDataFrameEvent(
    _event: IpcRendererEvent,
    sessionId: string,
    timing: SessionTiming,
    dataVars: SessionDataVariableValue<any>[]
  ) {
    this.emit(OverlayClientEventType.DATA_FRAME, sessionId, timing, dataVars)
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
  private async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    const ipcEventHandlers = Array<Pair<OverlayClientEventType, (event: IpcRendererEvent, ...args: any[]) => any>>(
        [OverlayClientEventType.SESSION_INFO, this.onSessionInfoEvent.bind(this)],
        [OverlayClientEventType.OVERLAY_CONFIG, this.onOverlayConfigEvent.bind(this)],
      [OverlayClientEventType.DATA_FRAME, this.onDataFrameEvent.bind(this)]
    )

    ipcEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(OverlayClientEventTypeToIPCName(type), handler)
    })

    if (isDev) {
      Object.assign(global, {
        sessionManagerClient: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            sessionManagerClient: null
          })

          ipcEventHandlers.forEach(([type, handler]) => {
            ipcRenderer.off(OverlayClientEventTypeToIPCName(type), handler)
          })
        })
      }
    }
    
    const [config, session] = await Promise.all([
        this.fetchOverlayConfig(),
        this.fetchSession()
    ])
    
    this.patchState({
      config,
      session
    })
  }

  /**
   * Service constructor
   *
   */
  constructor() {
    super()
  }

  @Bind
  async fetchOverlayConfig(): Promise<OverlayConfig> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.FETCH_CONFIG))
  }
  
  @Bind 
  fetchSession(): Promise<OverlaySessionData> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.FETCH_SESSION))
  }
  
  @Bind 
  close(): Promise<void> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.CLOSE))
  }

  
}

export default OverlayClient
