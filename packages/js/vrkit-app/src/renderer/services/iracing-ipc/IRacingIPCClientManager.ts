import { getLogger } from "@3fv/logger-proxy"
import { Container, Inject, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  IRacingIPCClient,
  IRacingIPCClientEventArgs,
  IRacingIPCClientEventKeys, IRacingIPCClientEventTypes
} from "vrkit-native-interop"
import { EnumValues, isEmpty, SessionDetail } from "@vrkit-platform/shared"
import { APP_STORE_ID } from "../../renderer-constants"
import type { AppStore } from "../store"
import { observeAppStore } from "../store/observeAppStore"
import EventEmitter3 from "eventemitter3"
import { guard, isNumber } from "@3fv/guard"
import { sharedAppSelectors } from "../store/slices/shared-app"
import type { Unsubscribe } from "@reduxjs/toolkit"
import { SessionEventType } from "@vrkit-platform/models"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class IRacingIPCClientManager extends EventEmitter3<IRacingIPCClientEventArgs> {
  
  private client_: IRacingIPCClient
  
  private appStoreUnsubscribe:Unsubscribe = null
  
  get client(): IRacingIPCClient {
    return this.client_
  }
  
  private set client(newClient: IRacingIPCClient) {
    this.resetClient()
    
    this.client_ = newClient
  }
  
  resetClient() {
    const oldClient = this.client_
    if (!oldClient) {
      guard(() => oldClient.disconnect())
      this.client_ = null
    }
  }
  
  constructor(
      @InjectContainer()
      readonly serviceContainer: Container,
      @Inject(APP_STORE_ID)
      readonly appStore: AppStore
  ) {
    super()
  }
  
  
  
  
  
  private onActiveSessionChanged(sessionDetail: SessionDetail)  {
    const pipePath = sessionDetail?.namedPipePath
    if (pipePath === this.client_?.pipePath) {
      info(`pipePath(${pipePath}) is unchanged, skipping`)
      return
    }
    this.resetClient()
    
    info(`Session detail changed, new namedPipePath is: `, pipePath)
    if (isEmpty(pipePath)) {
      warn(`No active session or invalid pipe path, not creating a client`)
      return
    }

    this.client = new IRacingIPCClient(pipePath)
    IRacingIPCClientEventTypes.forEach(ev => {
      this.client.on(ev, (...args) => {
        debug(`Received (IRacing IPC) client event event: ${ev} (${isNumber(ev) ? SessionEventType[ev] : ev})`, ...args)
        this.emit(ev, ...args)
      })
    })
    
    this.client.connect()
      .catch(err => {
        error(`Unable to connect to named pipe server: ${pipePath}`, err)
        this.resetClient()
      })
    
  }
  
  @PostConstruct()
  protected async init() {
    if (isDev) {
      Object.assign(global, {
        irc: this
      })
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.unload.bind(this))
    }
    
    info(`Connecting to iRacing IPC Server`)
    this.appStoreUnsubscribe = observeAppStore<SessionDetail>(
        sharedAppSelectors.selectActiveSession,
        this.onActiveSessionChanged.bind(this)
    )
  }
  
  [Symbol.dispose]() {
    this.appStoreUnsubscribe?.()
    this.appStoreUnsubscribe = null
    this.resetClient()
  }
  
  /**
   * Cleanup resources on unload
   *
   * @protected
   */
  protected unload() {
    debug(`Unloading iRacing IPC Manager`)
    this[Symbol.dispose]()
  }
  
  
}