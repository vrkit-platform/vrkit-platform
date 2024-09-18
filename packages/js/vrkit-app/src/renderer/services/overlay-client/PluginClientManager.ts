import { getLogger } from "@3fv/logger-proxy"

import { PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { isDev } from "../../constants"

import { OverlayClientEventHandler, OverlayConfig, OverlaySessionData } from "vrkit-app-common/models/overlay-manager"
import type { PluginClient, PluginClientComponentProps, PluginClientEventArgs } from "vrkit-plugin-sdk"
import { OverlayKind } from "vrkit-models"
import OverlayClient from "./OverlayClient"
import { asOption } from "@3fv/prelude-ts"
import TrackManager from "../track-manager"
import { isPromise } from "@3fv/guard"
import { importDefault } from "vrkit-app-common/utils"
import React from "react" // noinspection
// TypeScriptUnresolvedVariable

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class PluginClientManager {
  private builtinPluginCtx: any = null

  private pluginClient: PluginClient

  private reactComponent_: React.ComponentType<PluginClientComponentProps>

  private getPluginClient(): PluginClient {
    return asOption(this.pluginClient).getOrCall(() => {
      this.pluginClient = {
        getOverlayInfo: () => {
          return this.getConfig()?.overlay
        },
        fetchSessionInfo: this.fetchSessionInfo.bind(this),
        getSessionInfo: () => {
          return this.getSessionData()?.info
        },
        getSessionTiming: () => {
          return this.getSessionData()?.timing
        },
        getLapTrajectory: (trackLayoutId: string) => {
          return this.trackManager.getLapTrajectory(trackLayoutId)
        },
        getTrackMap: (trackLayoutId: string) => {
          return this.trackManager.getTrackMapFromLapTrajectory(trackLayoutId)
        },
        on: <T extends keyof PluginClientEventArgs, Fn extends PluginClientEventArgs[T] = PluginClientEventArgs[T]>(
          type: T,
          handler: Fn
        ) => {
          this.on<T>(type, handler as any)
        },
        off: <T extends keyof PluginClientEventArgs, Fn extends PluginClientEventArgs[T] = PluginClientEventArgs[T]>(
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
  @Bind
  private unload(event: Event = null) {
    debug(`Unloading overlay manager client`)

    window.getVRKitPluginClient = undefined
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

    window.getVRKitPluginClient = this.getPluginClient.bind(this)

    await this.launch().catch(err => error(`Failed to launch overlay`, err))
  }

  private async launch() {
    const config = this.getConfig()
    if (config.overlay.kind === OverlayKind.CUSTOM) {
      throw Error(`NotImplemented yet, will be part of plugin system`)
    }

    const builtinPluginImportPromise =
      config.overlay.kind === OverlayKind.TRACK_MAP ? import("../../overlays/track-map/TrackMapOverlayPlugin") : null

    if (!isPromise(builtinPluginImportPromise)) {
      throw Error(`${config.overlay.kind} is not implemented yet`)
    }

    this.reactComponent_ = await importDefault(builtinPluginImportPromise)
  }

  /**
   * Initialize dev environment tooling
   *
   * @private
   */
  private initDev() {
    if (isDev) {
      Object.assign(global, {
        overlayContentLoader: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          this.unload()

          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            overlayContentLoader: null
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
    readonly client: OverlayClient,
    readonly trackManager: TrackManager
  ) {}

  @Bind getConfig(): OverlayConfig {
    return this.client.config
  }

  @Bind getSessionData(): OverlaySessionData {
    return this.client.sessionData
  }

  @Bind
  async fetchSessionInfo() {
    const session = await this.client.fetchSession()
    return session?.info
  }

  on<Type extends keyof PluginClientEventArgs>(type: Type, handler: OverlayClientEventHandler<Type>) {
    this.client.on(type, handler as any)
  }

  off<Type extends keyof PluginClientEventArgs>(type: Type, handler?: OverlayClientEventHandler<Type>) {
    this.client.off(type, handler as any)
  }

  getReactComponent() {
    return this.reactComponent_
  }
}

export default OverlayClient
