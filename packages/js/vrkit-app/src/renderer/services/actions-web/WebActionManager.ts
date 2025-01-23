import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import {
  ActionCustomization, AppSettings
} from "@vrkit-platform/models"

import type { AppStore } from "../store"
import { ElectronIPCChannel } from "@vrkit-platform/shared"


// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


@Singleton()
export class WebActionManager {
  
  get state() {
    return this.appStore.getState().shared?.actions
  }
  
  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading web actions manager`)
    
    // TODO: Unsubscribe from ipcRenderer
  }
  
  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  // tslint:disable-next-line
  protected async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    
    if (isDev) {
      Object.assign(global, {
        webActionManager: this
      })
      
      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            webActionManager: null
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
  setCaptureKeyboardEnabled(enabled: boolean): Promise<boolean> {
    return ipcRenderer.invoke(ElectronIPCChannel.setCaptureKeyboardEnabled, enabled)
  }
  
  @Bind
  updateActionCustomization(customization: ActionCustomization): Promise<void> {
    return ipcRenderer.invoke(ElectronIPCChannel.updateActionCustomization, ActionCustomization.toJson(customization))
  }
  
  
  
  
}

export default WebActionManager
