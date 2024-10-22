import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import { OverlayManagerClientEventHandler } from "vrkit-shared"
import type {
  IPluginClient,
  IPluginClientComponentProps,
  IPluginClientEventArgs, SessionInfoMessage
} from "vrkit-plugin-sdk"
import { OverlayConfig, OverlayKind, SessionTiming } from "vrkit-models"
import OverlayManagerClient from "./OverlayManagerClient"
import { asOption } from "@3fv/prelude-ts"
import TrackManager from "../track-manager"
import { assign, importDefault, isEqual } from "vrkit-shared"
import React from "react"
import { sharedAppSelectors } from "../store/slices/shared-app"
import { AppStore } from "../store"
import { isPromise } from "@3fv/guard"
import { overlayWindowActions } from "../store/slices/overlay-window"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

type ReactPluginComponent = React.ComponentType<IPluginClientComponentProps> | Promise<React.ComponentType<IPluginClientComponentProps>>

const builtinPluginLoaders: Record<OverlayKind, () => Promise<ReactPluginComponent>> = {
  [OverlayKind.PLUGIN]: (() => {
    throw Error(`NotImplemented yet, will be part of plugin system`)
  }) as any,
  [OverlayKind.EDITOR_INFO]: () => importDefault(import("../../overlays/editor-info/EditorInfoOverlayPlugin")),
  // [OverlayKind.TRACK_MAP]: () => importDefault(import("../../overlays/track-map/TrackMapOverlayPlugin")),
  // [OverlayKind.CLOCK]: () => importDefault(import("../../overlays/clock/ClockOverlayPlugin"))
}

@Singleton()
export class PluginClientManager {
  private builtinPluginCtx: any = null

  private pluginClient: IPluginClient

  private reactComponent_: React.ComponentType<IPluginClientComponentProps>

  
  
  private getPluginClient(): IPluginClient {
    return asOption(this.pluginClient).getOrCall(() => {
      this.pluginClient = {
        inActiveSession: () => {
          const rootState = this.appStore.getState()
          return sharedAppSelectors.selectActiveSessionType(rootState) !== "NONE" && !!sharedAppSelectors.selectActiveSessionInfo(rootState)
        },
        getOverlayInfo: () => {
          return this.getConfig()?.overlay
        },
        // fetchSessionInfo: this.fetchSessionInfo.bind(this),
        getSessionInfo: () => {
          return sharedAppSelectors.selectActiveSessionInfo(this.appStore.getState())
        },
        getSessionTiming: () => {
          return sharedAppSelectors.selectActiveSessionTiming(this.appStore.getState())
        },
        getLapTrajectory: (trackLayoutId: string) => {
          return this.trackManager.getLapTrajectory(trackLayoutId)
        },
        getTrackMap: (trackLayoutId: string) => {
          return this.trackManager.getTrackMapFromLapTrajectory(trackLayoutId)
        },
        on: <T extends keyof IPluginClientEventArgs, Fn extends IPluginClientEventArgs[T] = IPluginClientEventArgs[T]>(
          type: T,
          handler: Fn
        ) => {
          this.on<T>(type, handler as any)
        },
        off: <T extends keyof IPluginClientEventArgs, Fn extends IPluginClientEventArgs[T] = IPluginClientEventArgs[T]>(
          type: T,
          handler: Fn
        ) => {
          this.off<T>(type, handler as any)
        }
      }
      return this.pluginClient
    })
  }
  
  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind private unload(event: Event = null) {
    debug(`Unloading overlay manager client`)
    
    window["getVRKitPluginClient"] = undefined
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

    this.initDev()
    
    window["getVRKitPluginClient"] = this.getPluginClient.bind(this)

    // await this.launch().catch(err => error(`Failed to launch overlay`, err))
  }

  async launch() {
    const config = this.getConfig()
    if (!config) {
      log.warn(`No OverlayConfig available, assuming internal window`)
      return null
    }
    
    const kind = config.overlay.kind
    const loaderFn = builtinPluginLoaders[kind]
    if (!loaderFn)
      throw Error(`Kind ${kind} is invalid`)
    
    const componentOrPromise = await loaderFn()
    
    this.reactComponent_ = isPromise(componentOrPromise) ? await componentOrPromise : componentOrPromise
    this.appStore.dispatch(overlayWindowActions.setOverlayComponent(this.reactComponent_))
  }

  /**
   * Initialize dev environment tooling
   *
   * @private
   */
  private initDev() {
    if (isDev) {
      Object.assign(global, {
        pluginClientManager: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          this.unload()

          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            pluginClientManager: null
          })
        })
      }
    }
  }

  /**
   * Service constructor
   *
   */
  constructor(
      @Inject(APP_STORE_ID) readonly appStore: AppStore,
      readonly client: OverlayManagerClient,
    readonly trackManager: TrackManager
  ) {}

  @Bind getConfig(): OverlayConfig {
    return this.client.overlayConfig
  }

  

  on<Type extends keyof IPluginClientEventArgs>(type: Type, handler: OverlayManagerClientEventHandler<Type>) {
    this.client.on(type, handler as any)
  }

  off<Type extends keyof IPluginClientEventArgs>(type: Type, handler?: OverlayManagerClientEventHandler<Type>) {
    this.client.off(type, handler as any)
  }

  getReactComponent() {
    return this.reactComponent_
  }
}

export default OverlayManagerClient
