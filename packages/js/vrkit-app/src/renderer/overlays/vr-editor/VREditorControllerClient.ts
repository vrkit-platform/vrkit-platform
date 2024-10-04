import { getLogger } from "@3fv/logger-proxy"

import { Container, Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { APP_STORE_ID, isDev } from "../../constants"

import {
  OverlayVREditorEventIPCNames, OverlayVREditorEventType,
  OverlayVREditorFnType,
  OverlayVREditorFnTypeToIPCName,
  OverlayVREditorState,
  OverlayVREditorStateSchema
} from "../../../common/models/overlays"

import EventEmitter3 from "eventemitter3"
import { assert, Disposables, Pair } from "../../../common/utils"
import { AppStore } from "../../services/store"
import { OverlayManagerClient } from "../../services/overlay-client"
import { resolveContainer } from "../../entry/overlay/overlayContainerFactory"
import { Deferred } from "@3fv/deferred"
import { useEffect, useState } from "react"
import { ipcRenderer, IpcRendererEvent } from "electron"
import { deserialize } from "serializr"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

let containerDeferred = new Deferred<Container>()

export interface VREditorControllerClientEventArgs {
  [OverlayVREditorEventType.STATE_CHANGED]: (state: OverlayVREditorState) => void
}

@Singleton()
export class VREditorControllerClient extends EventEmitter3<VREditorControllerClientEventArgs> {
  private readonly disposers_ = new Disposables()

  private state_:OverlayVREditorState = null
  
  get state() {
    return this.state_
  }
  
  ;[Symbol.dispose]() {
    debug(`Unloading vr editor client`)
    window.removeEventListener("beforeunload", this.unload)
    
    delete window["vrEditorControllerClient"]
    
    this.disposers_.dispose()
  }
  
  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event = null) {
    this[Symbol.dispose]()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    log.info("vrEditorControllerClient init()")
    window.addEventListener("beforeunload", this.unload)
    const ipcEventHandlers = Array<Pair<string, (event: IpcRendererEvent, ...args: any[]) => any>>(
        [OverlayVREditorEventIPCNames.STATE_CHANGED, this.onStateChangedHandler.bind(this)]
    )
    ipcEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(type, handler)
    })
    
    this.disposers_.push(() => {
      ipcEventHandlers.forEach(([type]) => {
        ipcRenderer.removeAllListeners(type)
      })
    })
    
    this.initDev()
    
    await this.fetchState()
  }

  /**
   * Initialize dev environment tooling
   *
   * @private
   */
  private initDev() {
    if (isDev) {
      Object.assign(window, {
        vrEditorControllerClient: this
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
   * @param client
   */
  constructor(
    @Inject(APP_STORE_ID) readonly appStore: AppStore,
    readonly client: OverlayManagerClient
  ) {
    super()
  }
  
  /**
   * Fetch state from main
   *
   * @return {Promise<OverlayVREditorState>}
   */
  @Bind
  async fetchState(): Promise<OverlayVREditorState> {
    const stateJs = await ipcRenderer.invoke(
        OverlayVREditorFnTypeToIPCName(OverlayVREditorFnType.FETCH_STATE)
    )
    
    return this.setState(stateJs)
  }
  
  private onStateChangedHandler(event: IpcRendererEvent, stateJs: OverlayVREditorState) {
    this.setState(stateJs)
  }
  
  /**
   * Update the state (it will use the schema & `deserialize`) &
   *  emit the change event
   *
   * @param state plain object or fully `deserialize(ed)`
   *
   * @returns {OverlayVREditorState}
   */
  private setState(state:OverlayVREditorState):OverlayVREditorState {
    log.info(`setState()`, state)
    this.state_ = deserialize(OverlayVREditorStateSchema, state)
    this.emit(OverlayVREditorEventType.STATE_CHANGED, this.state_)
    return this.state_
  }
}

export function getVREditorContainer(): Container {
  if (containerDeferred.isFulfilled()) {
    return containerDeferred.getResult()
  }else {
    return null
  }
}

export function getVREditorControllerClient():VREditorControllerClient {
  const container = getVREditorContainer()
  if (!container)
    return null
  
  return container.get(VREditorControllerClient)
}

export function useVREditorState():OverlayVREditorState {
  const
      vreClient = getVREditorControllerClient(),
      [vreState, setVREState] = useState(vreClient?.state)
  
  useEffect(() => {
    vreClient.on(OverlayVREditorEventType.STATE_CHANGED, newState => {
      log.info(`New VREditorState event received`, newState)
      setVREState(newState)
    })
    return () => {
      vreClient.removeAllListeners()
    }
  }, [vreClient])
  
  return vreState
}

async function createVREditorControllerClient() {
  const appContainerDeferred = resolveContainer()
  const appContainer = appContainerDeferred.getResult()
  assert(!!appContainer, "Container should be fully initialized by now")
  
  // noinspection UnnecessaryLocalVariableJS
  const container = await (new Container(appContainer))
      .bindClass(VREditorControllerClient)
      .resolveAll(),
      vrEditorControllerClient = container.get(VREditorControllerClient)
  
  window["vrEditorControllerClient"] = vrEditorControllerClient
  
  containerDeferred.resolve(container)
  
  return containerDeferred.promise
}

export default createVREditorControllerClient
