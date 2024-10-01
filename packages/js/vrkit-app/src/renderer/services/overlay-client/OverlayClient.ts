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
  OverlayMode,
  OverlaysState
} from "../../../common/models/overlays"
import { PluginClientEventType, type SessionInfoMessage } from "vrkit-plugin-sdk"
import { OverlayConfig, SessionDataVariableValueMap, SessionTiming } from "vrkit-models"
import type { AppStore } from "../store"
import { sharedAppSelectors } from "../store/slices/shared-app"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

/**
 * State patcher
 */
export type OverlayManagerStatePatchFn = (state: OverlaysState) => Partial<OverlaysState>

@Singleton()
export class OverlayClient extends EventEmitter3<OverlayClientEventArgs> {
  private cache_ = {
    sessionId: "",
    sessionInfo: null as SessionInfoMessage,
    sessionTiming: null as SessionTiming
  }

  private overlayConfig_: OverlayConfig = null

  get overlayConfig() {
    return this.overlayConfig_
  }

  get mode() {
    return this.appStore.getState().shared.overlayMode
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

    this.emit(OverlayClientEventType.OVERLAY_CONFIG, config)
  }

  // /**
  //  * On session info changed
  //  *
  //  * @param _event
  //  * @param sessionId
  //  * @param info
  //  */
  // private onSessionInfoEvent(_event: IpcRendererEvent, sessionId: string, info: SessionInfoMessage) {
  //   // this.patchState({
  //   //   session: {
  //   //     ...this.state.session,
  //   //     info,
  //   //     id: sessionId
  //   //   }
  //   // })
  //
  //   this.emit(PluginClientEventType.SESSION_INFO_CHANGED, sessionId, info)
  // }

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

  @Bind
  private onAppStoreStateChange() {
    const rootState = this.appStore.getState(),
      [sessionId, sessionInfo] = [
        sharedAppSelectors.selectActiveSessionId(rootState),
        sharedAppSelectors.selectActiveSessionInfo(rootState)
      ],
      cache = this.cache_

    let evType: PluginClientEventType = null
    if (sessionId !== cache.sessionId) evType = PluginClientEventType.SESSION_ID_CHANGED
    else if (!isEqual(sessionInfo, cache.sessionInfo)) evType = PluginClientEventType.SESSION_INFO_CHANGED

    if (evType) {
      Object.assign(cache, {
        sessionId,
        sessionInfo
      })

      this.emit(evType, sessionId, sessionInfo)
    }
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
      [PluginClientEventType.DATA_FRAME, this.onDataFrameEvent.bind(this)]
    )

    ipcEventHandlers.forEach(([type, handler]) => {
      ipcRenderer.on(OverlayClientEventTypeToIPCName(type), handler)
    })

    this.appStore.subscribe(this.onAppStoreStateChange)

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

    const config = await this.fetchOverlayConfig()
    log.info("Init loaded overlay config", config, "mode", this.overlayMode)
  }

  get overlayMode() {
    return sharedAppSelectors.selectOverlayMode(this.appStore.getState())
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
    const overlayId: string = await ipcRenderer.invoke(
        OverlayClientFnTypeToIPCName(OverlayClientFnType.FETCH_CONFIG_ID)
      ),
      //{dashboards:dashState, appSettings, overlays: overlayState} = this.appStore.getState().shared,
      activeDashConfig = sharedAppSelectors.selectActiveDashboardConfig(this.appStore.getState())
    if (!activeDashConfig) {
      log.error("Active dashboard not found")
      return null
    }
    const overlay = activeDashConfig.overlays.find(it => it.id === overlayId),
      placement = activeDashConfig.placements.find(it => it.overlayId === overlayId),
      overlayConfig: OverlayConfig = {
        overlay,
        placement
      }
    // overlayConfig?: OverlayConfig
    log.info(`Loaded overlay config`, overlayConfig)

    this.overlayConfig_ = overlayConfig

    return this.overlayConfig
  }

  @Bind
  async setMode(mode: OverlayMode): Promise<OverlayMode> {
    if (mode === this.mode) return mode
    return await ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.SET_OVERLAY_MODE), mode)
  }

  @Bind close(): Promise<void> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.CLOSE))
  }
}

export default OverlayClient
