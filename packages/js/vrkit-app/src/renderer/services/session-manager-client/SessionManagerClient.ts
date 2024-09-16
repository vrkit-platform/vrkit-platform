import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { APP_STORE_ID, isDev } from "../../constants"

import type { AppStore } from "../store"
import { SessionPlayer } from "vrkit-native-interop"
import { SessionDataVariable, SessionTiming } from "vrkit-models"
import {
  ActiveSessionType,
  SessionManagerEventType,
  SessionManagerEventTypeToIPCName,
  SessionManagerFnType,
  SessionManagerFnTypeToIPCName,
  SessionManagerState,
  SessionPlayerId
} from "vrkit-app-common/models/session-manager"
import EventEmitter3 from "eventemitter3"
import { sessionManagerActions } from "../store/slices/session-manager"
import { Disposables, Pair } from "vrkit-app-common/utils"
import {
  OverlayClientEventType,
  OverlayClientEventTypeToIPCName,
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName,
  OverlayMode
} from "vrkit-app-common/models/overlay-manager"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

class SessionPlayerContainer {
  readonly disposers = Array<() => void>()

  private timing_: SessionTiming = null

  private dataVars_: SessionDataVariable[] = []

  get timing() {
    return this.timing_
  }

  get dataVars() {
    return this.dataVars_
  }

  constructor(
    readonly id: SessionPlayerId,
    readonly player: SessionPlayer
  ) {}

  dispose() {
    this.disposers.forEach(disposer => disposer())
  }

  setDataFrame(timing: SessionTiming, dataVars: SessionDataVariable[]): void {
    this.timing_ = timing
    this.dataVars_ = dataVars
  }
}

// export enum SessionManagerClientEventType {
//   UNKNOWN = "UNKNOWN",
//   STATE_CHANGED = "STATE_CHANGED",
//   DATA_FRAME = "DATA_FRAME"
// }

export interface SessionManagerClientEventArgs {
  [SessionManagerEventType.STATE_CHANGED]: (
    client: SessionManagerClient,
    state: SessionManagerState
  ) => void

  [SessionManagerEventType.DATA_FRAME]: (
    client: SessionManagerClient,
    dataVars: SessionDataVariable[]
  ) => void
}

type SessionEventHandlerPair = Pair<
    SessionManagerEventType,
    (event: IpcRendererEvent, ...args: any[]) => any
>

type OverlayEventHandlerPair = Pair<
    OverlayClientEventType,
    (event: IpcRendererEvent, ...args: any[]) => any
>

@Singleton()
export class SessionManagerClient extends EventEmitter3<SessionManagerClientEventArgs> {
  
  private disposers = new Disposables()
  
  @Bind
  private onSessionManagerStateChangedEvent(
    _event: IpcRendererEvent,
    newState: SessionManagerState
  ) {
    this.updateState(newState)
  }

  
  private onSessionManagerDataFrameEvent(
    _event: IpcRendererEvent,
    sessionId: string,
    dataVars: SessionDataVariable[]
  ) {}
  
  
  private onOverlayModeEvent(
      _event: IpcRendererEvent,
      mode: OverlayMode
  ) {
    log.info("OVERLAY MODE RECEIVED", mode)
    this.appStore.dispatch(sessionManagerActions.patch({overlayMode: mode}))
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event = null) {
    debug(`Unloading session manager client`)
    
    this.disposers.dispose()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    
    
    const ipcSessionEventHandlers = Array<SessionEventHandlerPair>(
      [
        SessionManagerEventType.STATE_CHANGED,
        this.onSessionManagerStateChangedEvent.bind(this)
      ],
      [
        SessionManagerEventType.DATA_FRAME,
        this.onSessionManagerDataFrameEvent.bind(this)
      ]
    )
    
    const ipcOverlayEventHandlers = Array<
        OverlayEventHandlerPair
    >(
        [
          OverlayClientEventType.OVERLAY_MODE,
          this.onOverlayModeEvent.bind(this)
        ]
    )

    ipcSessionEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(SessionManagerEventTypeToIPCName(type), handler)
    })
    
    ipcOverlayEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(OverlayClientEventTypeToIPCName(type), handler)
    })
    
    this.disposers.push(() => {
      ipcSessionEventHandlers.forEach(([type, handler]) => {
        ipcRenderer.off(SessionManagerEventTypeToIPCName(type), handler)
      })
      
      ipcOverlayEventHandlers.forEach(([type, handler]) => {
        ipcRenderer.off(OverlayClientEventTypeToIPCName(type), handler)
      })
      
      Object.assign(global, {
        sessionManagerClient: null
      })
      
      window.removeEventListener("beforeunload", this.unload)
      
    })
    
    if (isDev) {
      Object.assign(global, {
        sessionManagerClient: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          this.unload()
        })
      }
    }
  }

  /**
   * Update the whole SessionManagerState slice
   */
  updateState(newState: Partial<SessionManagerState>) {
    this.appStore.dispatch(sessionManagerActions.patch(newState))
  }

  /**
   * Service constructor
   *
   * @param appStore
   */
  constructor(@Inject(APP_STORE_ID) readonly appStore: AppStore) {
    super()
  }

  @Bind setActiveSessionType(
    type: ActiveSessionType
  ): Promise<ActiveSessionType> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(
        SessionManagerFnType.SET_ACTIVE_SESSION_TYPE
      ),
      type
    )
  }

  @Bind
  async getMainSessionManagerState(): Promise<SessionManagerState> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(SessionManagerFnType.GET_STATE)
    )
  }

  @Bind closeDiskSession(): Promise<boolean> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(SessionManagerFnType.CLOSE_DISK_SESSION)
    )
  }

  @Bind showOpenDiskSession(): Promise<string> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(SessionManagerFnType.SHOW_OPEN_DISK_SESSION)
    )
  }
  
  @Bind
  async setOverlayMode(mode: OverlayMode): Promise<void> {
    const newMode = await ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.SET_OVERLAY_MODE), mode)
    
    this.appStore.dispatch(sessionManagerActions.setOverlayMode(newMode))
  }
}

export default SessionManagerClient
