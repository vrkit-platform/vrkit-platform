import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"

import { APP_STORE_ID, isDev } from "../../constants"

import {
  DashboardConfig
} from "vrkit-models"

import type { AppStore } from "../store"
import {
  OverlayClientFnType,
  OverlayClientFnTypeToIPCName
} from "vrkit-app-common/models"


// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


@Singleton()
export class DashboardManagerClient {
  
  get dashboardConfigs() {
    return this.appStore.getState().shared?.overlayManager?.dashboardConfigs ?? []
  }
  
  
  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading dashboard manager client`)

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
        dashboardManagerClient: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            dashboardManagerClient: null
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
  updateDashboardConfig(id: string, patch:Partial<DashboardConfig>):Promise<DashboardConfig> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.UPDATE_DASHBOARD_CONFIG), id, patch)
  }
  
  @Bind
  launchLayoutEditor(id: string): Promise<DashboardConfig> {
    return ipcRenderer.invoke(OverlayClientFnTypeToIPCName(OverlayClientFnType.LAUNCH_DASHBOARD_LAYOUT_EDITOR), id)
  }
}

export default DashboardManagerClient
