import { ipcRenderer } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  Bind,
  Disposables,
  IPluginManagerClient, PluginManagerEventArgs,
  PluginManagerFnType,
  PluginManagerFnTypeToIPCName
} from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import EventEmitter3 from "eventemitter3"
import type { AppStore } from "../store"
import { PluginInstall } from "@vrkit-platform/models"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class PluginManagerClient extends EventEmitter3<PluginManagerEventArgs> implements IPluginManagerClient {
  private readonly disposers_ = new Disposables()

  get state() {
    return this.appStore.getState().shared.plugins
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
    Object.assign(global, {
      pluginManagerClient: null
    })
    this[Symbol.dispose]()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct()
  protected async init(): Promise<void> {
    window.addEventListener("beforeunload", this.unload)

    if (isDev) {
      Object.assign(global, {
        pluginManagerClient: this
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
   */
  constructor(
    @Inject(APP_STORE_ID)
    readonly appStore: AppStore
  ) {
    super()
  }

  @Bind
  async installPlugin(id: string): Promise<PluginInstall> {
    return await ipcRenderer.invoke(PluginManagerFnTypeToIPCName(PluginManagerFnType.INSTALL_PLUGIN), id)
  }
  
  @Bind
  async updatePlugin(id: string): Promise<PluginInstall> {
    return await ipcRenderer.invoke(PluginManagerFnTypeToIPCName(PluginManagerFnType.UPDATE_PLUGIN), id)
  }
  
  
  @Bind
  async uninstallPlugin(id: string): Promise<void> {
    await ipcRenderer.invoke(PluginManagerFnTypeToIPCName(PluginManagerFnType.UNINSTALL_PLUGIN), id)
  }

  @Bind
  async refreshAvailablePlugins(): Promise<void> {
    await ipcRenderer.invoke(PluginManagerFnTypeToIPCName(PluginManagerFnType.REFRESH_AVAILABLE_PLUGINS))
  }
}

export default PluginManagerClient
