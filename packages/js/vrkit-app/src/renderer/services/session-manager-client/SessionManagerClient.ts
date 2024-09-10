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
// import {
//   sessionManagerActions,
//   sessionManagerSelectors
// } from "../store/slices/session-manager"
import EventEmitter3 from "eventemitter3"
import { sessionManagerActions } from "../store/slices/session-manager"
import { Pair } from "vrkit-app-common/utils"

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

@Singleton()
export class SessionManagerClient extends EventEmitter3<SessionManagerClientEventArgs> {
  @Bind
  private onSessionManagerStateChangedEvent(
    _event: IpcRendererEvent,
    newState: SessionManagerState
  ) {
    this.updateState(newState)
  }

  @Bind
  private onSessionManagerDataFrameEvent(
    _event: IpcRendererEvent,
    sessionId: string,
    dataVars: SessionDataVariable[]
  ) {}

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading session manager client`)

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
    const ipcEventHandlers = Array<
      Pair<
        SessionManagerEventType,
        (event: IpcRendererEvent, ...args: any[]) => any
      >
    >(
      [
        SessionManagerEventType.STATE_CHANGED,
        this.onSessionManagerStateChangedEvent.bind(this)
      ],
      [
        SessionManagerEventType.DATA_FRAME,
        this.onSessionManagerDataFrameEvent.bind(this)
      ]
    )

    ipcEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(SessionManagerEventTypeToIPCName(type), handler)
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
            ipcRenderer.off(SessionManagerEventTypeToIPCName(type), handler)
          })
        })
      }
    }
  }

  /**
   * Update the whole SessionManagerState slice
   */
  updateState(newState: SessionManagerState) {
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
}

export default SessionManagerClient
