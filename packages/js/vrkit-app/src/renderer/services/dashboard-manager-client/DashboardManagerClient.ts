import { ipcRenderer, IpcRendererEvent } from "electron"
import { getLogger } from "@3fv/logger-proxy"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import {
  DashboardConfig
} from "@vrkit-platform/models"

import type { AppStore } from "../store"
import {
  DashboardManagerFnType, DashboardManagerFnTypeToIPCName,
  
} from "@vrkit-platform/shared"


// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


@Singleton()
export class DashboardManagerClient {
  
  get state() {
    return this.appStore.getState().shared?.dashboards
  }
  
  get configs() {
    return this.state.configs ?? []
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
  protected async init(): Promise<void> {
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
  createDashboardConfig(patch:Partial<DashboardConfig> = {}):Promise<DashboardConfig> {
    log.info(`Creating new dashboard with patch`, patch)
    return ipcRenderer.invoke(DashboardManagerFnTypeToIPCName(DashboardManagerFnType.CREATE_DASHBOARD_CONFIG), patch)
  }
  
  @Bind
  updateDashboardConfig(id: string, patch:Partial<DashboardConfig>):Promise<DashboardConfig> {
    return ipcRenderer.invoke(DashboardManagerFnTypeToIPCName(DashboardManagerFnType.UPDATE_DASHBOARD_CONFIG), id, patch)
  }
  
  @Bind
  deleteDashboardConfig(id: string):Promise<DashboardConfig> {
    return ipcRenderer.invoke(DashboardManagerFnTypeToIPCName(DashboardManagerFnType.DELETE_DASHBOARD_CONFIG), id)
  }
  
  @Bind
  openDashboard(id: string):Promise<string> {
    return ipcRenderer.invoke(DashboardManagerFnTypeToIPCName(DashboardManagerFnType.OPEN_DASHBOARD), id)
  }
  
  @Bind
  closeDashboard():Promise<void> {
    return ipcRenderer.invoke(DashboardManagerFnTypeToIPCName(DashboardManagerFnType.CLOSE_DASHBOARD))
  }
  
  @Bind
  launchLayoutEditor(id: string): Promise<DashboardConfig> {
    return ipcRenderer.invoke(DashboardManagerFnTypeToIPCName(DashboardManagerFnType.LAUNCH_DASHBOARD_LAYOUT_EDITOR), id)
  }
  
  
}

export default DashboardManagerClient
