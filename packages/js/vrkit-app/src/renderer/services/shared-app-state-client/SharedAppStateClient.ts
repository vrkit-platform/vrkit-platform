 import { getLogger } from "@3fv/logger-proxy"
import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { APP_STORE_ID, isDev } from "../../constants"

import { ipcRenderer, IpcRendererEvent } from "electron"
import type { ISharedAppState } from "vrkit-app-common/models/app"
import type { AppStore } from "../store"
import { sharedAppActions } from "../store/slices/shared-app"
import { ElectronIPCChannel } from "vrkit-app-common/services"
import { OverlayManagerClientFnType, OverlayManagerClientFnTypeToIPCName } from "../../../common/models/overlays"
 import { SharedAppStateSchema } from "vrkit-app-common/models/app"
 import { deserialize } from "serializr"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class SharedAppStateClient {

  private patchState(patch: Partial<ISharedAppState>) {
    //info(`shared app state`, patch)
    this.appStore.dispatch(sharedAppActions.patch(patch))
  }
  
  @Bind
  private onSharedAppStateChanged(ev: IpcRendererEvent, sharedAppState: ISharedAppState) {
    this.patchState(deserialize(SharedAppStateSchema, sharedAppState))
  }

  async fetchSharedAppState(): Promise<ISharedAppState> {
    return deserialize(SharedAppStateSchema, await ipcRenderer.invoke(ElectronIPCChannel.fetchSharedAppState))
  }
  
  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event?: Event) {
    debug(`Unloading overlay window controls`)
    
    ipcRenderer.off(ElectronIPCChannel.sharedAppStateChanged, this.onSharedAppStateChanged)
    
    window.removeEventListener("beforeunload", this.unload)
    Object.assign(window, {
      sharedAppStateClient: undefined
    })
  }
  
  
  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct()
  // @ts-ignore
  // tslint:disable-next-line
  private async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    
    ipcRenderer.on(ElectronIPCChannel.sharedAppStateChanged, this.onSharedAppStateChanged)
    const state = await this.fetchSharedAppState()
    info(`Initial shared state`, state)
    this.patchState(state)
    
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.unload()
      })
    }

    if (isDev) {
      Object.assign(window, {
        sharedAppStateClient: this
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
  constructor(@Inject(APP_STORE_ID) readonly appStore: AppStore) {}
  
  
}

export default SharedAppStateClient
