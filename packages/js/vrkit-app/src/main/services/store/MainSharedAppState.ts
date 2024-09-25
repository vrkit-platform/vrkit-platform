import { Deferred } from "@3fv/deferred"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { applyDecorators, Bind, Once } from "vrkit-app-common/decorators"
import { DevSettings, ISharedAppState, newDevSettings, ThemeId } from "vrkit-app-common/models"
import { assign, cloneDeep, once } from "vrkit-app-common/utils"
import { action, makeObservable, observable, toJS } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"

import { broadcastToAllWindows, getAppThemeFromSystem } from "../../utils"
import { newOverlayManagerState, OverlayManagerState, OverlayMode } from "vrkit-app-common/models/overlay-manager"
import { AppSettings } from "vrkit-models"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import { MainSharedAppStateSchema } from "../../models"
import { serialize } from "serializr"

const log = getLogger(__filename)

const { debug, trace, info, error, warn } = log
const BindAction = () => applyDecorators(Bind, action)

@Singleton()
export class MainSharedAppState implements ISharedAppState {
  private initDeferred: Deferred<MainSharedAppState>

  private stopObserving: IDisposer

  private shutdownInProgress: boolean = false

  // @observable zoomFactor:number = 1.0

  @observable systemTheme: ThemeId = getAppThemeFromSystem()

  @observable overlayMode: OverlayMode = OverlayMode.NORMAL

  /**
   * Get app settings from state
   */
  @observable appSettings: AppSettings = AppSettings.create()

  // @observable customAccelerators:Record<string, string> = {}
  //
  // @observable themeType:ThemeType = null
  //
  // @observable activeDashboardId:string = null
  //
  // @observable autoconnect:boolean = false
  //
  //newNativeImageSequenceCaptureSettings()
  @observable devSettings = newDevSettings()

  // get theme():ThemeId {
  //   return (
  //       isString(this.themeType) ? this.themeType : ThemeType[this.themeType]
  //   ) as ThemeId
  // }

  // get appSettings():AppSettings {
  //   return AppSettings.create({
  //     autoconnect: this.autoconnect,
  //     themeType: this.themeType ?? ThemeType.AUTO,
  //     activeDashboardId: this.activeDashboardId,
  //     zoomFactor: this.zoomFactor
  //   })
  // }

  @observable overlayManager = newOverlayManagerState()

  get isShutdownInProgress() {
    return this.shutdownInProgress
  }

  constructor() {
    this.init().catch(err => {
      error(`Failed to init store`, err)
    })
  }

  @Bind
  private onChange() {
    if (this.shutdownInProgress) {
      warn("Shutdown in progress, ignoring change")
      return
    }

    this.broadcast()
  }

  private broadcast() {
    const sharedAppStateObj = toJS(this.toJSON())
    info("Broadcasting shared app state", sharedAppStateObj)
    broadcastToAllWindows(ElectronIPCChannel.sharedAppStateChanged, sharedAppStateObj)
  }

  @Once()
  private async init() {
    if (this.initDeferred) {
      return this.initDeferred.promise
    }
    this.initDeferred = new Deferred<MainSharedAppState>()
    try {
      makeObservable(this)
      const unsubscribe = (this.stopObserving = deepObserve(this, this.onChange))
      ipcMain.handle(ElectronIPCChannel.fetchSharedAppState, this.fetchSharedAppStateHandler)
      if (module.hot) {
        module.hot.addDisposeHandler(() => {
          warn(`HMR removing observer`)
          ipcMain.removeHandler(ElectronIPCChannel.fetchSharedAppState)
          unsubscribe()
        })
      }

      this.initDeferred.resolve(this)
    } catch (err) {
      error(`init failed`, err)
      this.initDeferred.reject(err)
    }

    return this.initDeferred.promise
  }

  setShutdownInProgress(shutdownInProgress: boolean = true) {
    this.shutdownInProgress = shutdownInProgress
    this.stopObserving()
  }

  @Bind @PostConstruct() whenReady() {
    return this.initDeferred.promise
  }

  @BindAction() setAppSettings(appSettings: AppSettings) {
    this.appSettings = appSettings
  }

  @BindAction() updateAppSettings(patch: Partial<AppSettings>) {
    this.appSettings = assign(AppSettings.clone(this.appSettings), patch)
  }

  @BindAction() setOverlayManagerState(state: OverlayManagerState) {
    this.overlayManager = state
  }

  @BindAction() updateOverlayManager(patch: Partial<OverlayManagerState>) {
    this.overlayManager = assign(cloneDeep(this.overlayManager), patch)
  }

  @BindAction() updateDevSettings(patch: Partial<DevSettings>) {
    this.devSettings = assign(cloneDeep(this.devSettings), patch)
  }

  @BindAction() setOverlayMode(overlayMode: OverlayMode) {
    this.overlayMode = overlayMode
  }

  @BindAction() setSystemTheme(theme: ThemeId) {
    this.systemTheme = theme
  }

  @Bind
  private async fetchSharedAppStateHandler(_ev: IpcMainInvokeEvent): Promise<ISharedAppState> {
    const stateJs = this.toJSON()
    info("Sending state js", stateJs)
    return stateJs
  }

  toJSON() {
    return serialize(MainSharedAppStateSchema, this)
  }
}

const instanceDeferred = new Deferred<MainSharedAppState>()

/**
 * Get main state store if it's been resolved
 *
 * @returns singleton store
 */
export function getSharedAppStateStore() {
  if (instanceDeferred.isRejected()) {
    throw instanceDeferred.getError()
  } else if (instanceDeferred.isFulfilled()) {
    return instanceDeferred.getResult()
  } else {
    return null
  }
}

/**
 * Async factory for main state store
 */
export const createSharedAppStateStore = once(async () => {
  const store = new MainSharedAppState()
  await store.whenReady().then(
    () => instanceDeferred.resolve(store),
    err => {
      instanceDeferred.reject(err)
      throw err
    }
  )
  return store
})
