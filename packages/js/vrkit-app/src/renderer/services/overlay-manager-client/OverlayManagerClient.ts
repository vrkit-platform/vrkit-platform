import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import EventEmitter3 from "eventemitter3"
import {
  Disposables, isArray,
  isEmpty,
  isEqual,
  Pair
} from "@vrkit-platform/shared"
import {
  DefaultOverlayManagerClient,
  OverlayWindowRole,
  OverlayClientEventTypeToIPCName,
  OverlayManagerClientEventArgs,
  OverlayManagerClientEventType,
  OverlayManagerClientFnType,
  OverlayManagerClientFnTypeToIPCName,
} from "@vrkit-platform/shared"
import { PluginClientEventType, type SessionInfoMessage } from "@vrkit-platform/plugin-sdk"
import { OverlayConfig, SessionDataVariableValueMap, SessionTiming } from "@vrkit-platform/models"
import type { AppStore } from "../store"
import { sharedAppSelectors } from "../store/slices/shared-app"
import { overlayWindowActions } from "../store/slices/overlay-window"
import "@vrkit-platform/plugin-sdk"
import { match } from "ts-pattern"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class OverlayManagerClient
  extends EventEmitter3<OverlayManagerClientEventArgs>
  implements DefaultOverlayManagerClient
{
  private readonly disposers_ = new Disposables()
  private cache_ = {
    sessionId: "",
    sessionInfo: null as SessionInfoMessage,
    sessionTiming: null as SessionTiming
  }

  private overlayConfig_: OverlayConfig = null

  get overlayConfig() {
    return this.overlayConfig_
  }

  private windowRole_: OverlayWindowRole = null

  get windowRole() {
    return this.windowRole_
  }

  get state() {
    return this.appStore.getState().shared.overlays
  }
  get editorEnabled() {
    return this.state.editor.enabled
  }

  /**
   * On overlay config changed
   *
   * @param _event
   * @param configJs
   */
  private onOverlayConfigEvent(_event: IpcRendererEvent, configJs: OverlayConfig) {
    const config = OverlayConfig.fromJson(configJs as any)
    this.overlayConfig_ = config

    this.emit(OverlayManagerClientEventType.OVERLAY_CONFIG, config)
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
   * On App State change (subscribed to app store),
   * check if session info or session id changed.
   *
   * If either changed, emit the respective event info
   *
   * @private
   */
  @Bind
  private onAppStoreStateChange() {
    const rootState = this.appStore.getState(),
      [sessionId, sessionInfo] = [
        sharedAppSelectors.selectActiveSessionId(rootState),
        sharedAppSelectors.selectActiveSessionInfo(rootState)
      ],
      cache = this.cache_,

      evType: PluginClientEventType = match(sessionId)
        .with(cache.sessionId, () => PluginClientEventType.SESSION_INFO_CHANGED)
        .otherwise(() => PluginClientEventType.SESSION_ID_CHANGED)
    
    
    Object.assign(cache, {
      sessionId,
      sessionInfo
    })

    this.emit(evType, sessionId, sessionInfo)
  
  }
  
  [Symbol.dispose]() {
    debug(`Disposing overlay manager client`)
    
    this.disposers_.dispose()
  }
  
  /**
   * Cleanup resources on unload
   *
   * @param _event
   * @private
   */
  @Bind
  private unload(_event?: Event) {
    debug(`Unloading overlay manager client`)

    this[Symbol.dispose]()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct()
  private async init(): Promise<void> {
    
    window.addEventListener("beforeunload", this.unload)
    
    if (isVRKitOverlayWindow) {
      // IPC EVENT CHANNEL <> HANDLER PAIRS
      const ipcEventHandlers = Array<
        Pair<OverlayManagerClientEventType | PluginClientEventType, (event: IpcRendererEvent, ...args: any[]) => any>
      >(
        [OverlayManagerClientEventType.OVERLAY_CONFIG, this.onOverlayConfigEvent.bind(this)],
        [PluginClientEventType.DATA_FRAME, this.onDataFrameEvent.bind(this)]
      )

      // IPC SETUP
      ipcEventHandlers.forEach(([type, handler]) => {
        ipcRenderer.on(OverlayClientEventTypeToIPCName(type), handler)
      })

      // SUBSCRIBE TO `appStore`
      this.disposers_.push(this.appStore.subscribe(this.onAppStoreStateChange))

      // ADD DISPOSER OF EVENT HANDLERS/FNS, ETC
      this.disposers_.push(() => {
        window.removeEventListener("beforeunload", this.unload)
        Object.assign(global, {
          overlayClient: null
        })

        ipcEventHandlers.forEach(([type, handler]) => {
          //ipcRenderer.off(OverlayClientEventTypeToIPCName(type), handler)
          ipcRenderer.removeAllListeners(OverlayClientEventTypeToIPCName(type))
        })
      })
      
      const role = await this.fetchOverlayWindowRole()
      const config = await this.fetchOverlayConfig()
      
      log.info("Init loaded overlay config", config, "role", role, "mode", this.overlayMode)
    }
    
    if (isDev) {
      Object.assign(global, {
        overlayClient: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          this.unload()
        })
      }
    }
    
    
  }

  get overlayMode() {
    return sharedAppSelectors.selectEditorEnabled(this.appStore.getState())
  }


  /**
   * Service constructor
   *
   */
  constructor(
    @Inject(APP_STORE_ID)
    readonly appStore: AppStore
  ) {
    super()
  }
  
  @Bind
  async fetchOverlayWindowRole(): Promise<OverlayWindowRole> {
    const role = await ipcRenderer.invoke(
        OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.FETCH_WINDOW_ROLE)
    )
    
    this.windowRole_ = role
    this.appStore.dispatch(overlayWindowActions.setWindowRole(role))
    return role
  }
  
  @Bind
  async fetchOverlayId(): Promise<string> {
    return await ipcRenderer.invoke(
        OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.FETCH_CONFIG_ID)
    )
  }
  
  @Bind
  async fetchOverlayConfig(): Promise<OverlayConfig> {
    const overlayId: string = await this.fetchOverlayId(),
      activeDashConfig = sharedAppSelectors.selectActiveDashboardConfig(this.appStore.getState())
    
    if (!activeDashConfig) {
      log.error("Active dashboard not found")
      return null
    }
    
    const {overlays, placements} = activeDashConfig
    if ([overlays, placements].some(it => !isArray(it) || isEmpty(it))) {
      log.error("Active dashboard config is invalid, either `overlays` or `placements` are not of type `array` or are empty", overlays, placements)
      return null
    }
    
    const overlay = overlays.find(it => it.id === overlayId),
      placement = placements.find(it => it.overlayId === overlayId)
    
    let overlayConfig:OverlayConfig = null
    if (!placement || !overlay) {
      log.warn("Unable to find OverlayConfig in dashboard configs, getting directly")
      const overlayConfigJs = await ipcRenderer.invoke(OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.FETCH_CONFIG))
      overlayConfig = OverlayConfig.fromJson(overlayConfigJs as any)
    } else {
      overlayConfig = {
        isScreen: !isVRKitEnvVR,
        overlay, placement
      }
    }
    
    log.info(`Loaded overlay config`, overlayConfig)

    this.overlayConfig_ = overlayConfig

    return this.overlayConfig
  }

  @Bind
  async setEditorEnabled(enabled: boolean): Promise<boolean> {
    if (enabled === this.editorEnabled) {
      return enabled
    }
    return await ipcRenderer.invoke(
      OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.SET_EDITOR_ENABLED),
      enabled
    )
  }
  
  @Bind
  close(): Promise<void> {
    return ipcRenderer.invoke(OverlayManagerClientFnTypeToIPCName(OverlayManagerClientFnType.CLOSE))
  }
}

export default OverlayManagerClient
