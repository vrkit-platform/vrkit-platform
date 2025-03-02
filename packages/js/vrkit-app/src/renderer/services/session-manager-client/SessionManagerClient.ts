import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import type { AppStore } from "../store"
import { SessionPlayer } from "vrkit-native-interop"
import { SessionDataVariable, SessionTiming } from "@vrkit-platform/models"
import {
  ActiveSessionType,
  SessionManagerEventType,
  SessionManagerEventTypeToIPCName,
  SessionManagerFnType,
  SessionManagerFnTypeToIPCName,
  SessionsState,
  SessionPlayerId
} from "@vrkit-platform/shared"
import EventEmitter3 from "eventemitter3"

import { Disposables, Pair } from "@vrkit-platform/shared"
import {
  OverlayManagerClientEventType,
  OverlayClientEventTypeToIPCName
} from "@vrkit-platform/shared"

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

export interface SessionManagerClientEventArgs {
  
  [SessionManagerEventType.DATA_FRAME]: (
    client: SessionManagerClient,
    dataVars: SessionDataVariable[]
  ) => void
  [SessionManagerEventType.TIMING_CHANGED]: (
      client: SessionManagerClient,
      timing: SessionTiming
  ) => void
}

type SessionEventHandlerPair = Pair<
    SessionManagerEventType,
    (event: IpcRendererEvent, ...args: any[]) => any
>

type OverlayEventHandlerPair = Pair<
    OverlayManagerClientEventType,
    (event: IpcRendererEvent, ...args: any[]) => any
>

@Singleton()
export class SessionManagerClient extends EventEmitter3<SessionManagerClientEventArgs> {
  
  private disposers = new Disposables()
  
  private onSessionManagerDataFrameEvent(
    _event: IpcRendererEvent,
    sessionId: string,
    dataVars: SessionDataVariable[]
  ) {}
  
  private onSessionManagerTimingChangedEvent(
      _event: IpcRendererEvent,
      sessionId: string,
      timing: SessionTiming
  ) {
    this.emit(SessionManagerEventType.TIMING_CHANGED, this, timing)
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
  protected async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    
    
    const ipcSessionEventHandlers = Array<SessionEventHandlerPair>(
      [
        SessionManagerEventType.DATA_FRAME,
        this.onSessionManagerDataFrameEvent.bind(this)
      ],
      [
        SessionManagerEventType.TIMING_CHANGED,
        this.onSessionManagerTimingChangedEvent.bind(this)
      ]
    )
    
    ipcSessionEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(SessionManagerEventTypeToIPCName(type), handler)
    })
    
    this.disposers.push(() => {
      ipcSessionEventHandlers.forEach(([type, handler]) => {
        ipcRenderer.off(SessionManagerEventTypeToIPCName(type), handler)
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
   * Service constructor
   *
   * @param appStore
   */
  constructor(@Inject(APP_STORE_ID) readonly appStore: AppStore) {
    super()
  }

  @Bind setLiveSessionActive(
    active: boolean
  ): Promise<ActiveSessionType> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(
        SessionManagerFnType.SET_LIVE_SESSION_ACTIVE
      ),
        active
    )
  }

  @Bind closeDiskSession(): Promise<boolean> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(SessionManagerFnType.CLOSE_DISK_SESSION)
    )
  }
  
  /**
   * Open a disk session
   */
  @Bind showOpenDiskSession(): Promise<string> {
    return ipcRenderer.invoke(
      SessionManagerFnTypeToIPCName(SessionManagerFnType.SHOW_OPEN_DISK_SESSION)
    )
  }
  
  
}

export default SessionManagerClient
