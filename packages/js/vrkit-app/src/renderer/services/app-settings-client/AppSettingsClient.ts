import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import {
  AppSettings
} from "@vrkit-platform/models"

import type { AppStore } from "../store"
import { ElectronIPCChannel } from "@vrkit-platform/shared"


// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


@Singleton()
export class AppSettingsClient {
  
  get state() {
    return this.appStore.getState().shared?.appSettings
  }
  
  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading app settings client`)

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

    if (isDev) {
      Object.assign(global, {
        appSettingsClient: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            appSettingsClient: null
          })
        })
      }
    }
  }

  /**
   * Service constructor
   *
   */
  constructor(@Inject(APP_STORE_ID) readonly appStore: AppStore) {
  
  }
  
  @Bind
  changeSettings(patch:Partial<AppSettings>): Promise<AppSettings> {
    return ipcRenderer.invoke(ElectronIPCChannel.saveAppSettings, patch)
  }
  
  
}

export default AppSettingsClient
