import { Deferred } from "@3fv/deferred"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { applyDecorators, Bind, Once } from "vrkit-app-common/decorators"
import { DevSettings, ISharedAppState, newDevSettings, ThemeId } from "vrkit-app-common/models"
import { assign, cloneDeep, entriesOf, once } from "vrkit-app-common/utils"
import { action, makeObservable, observable, set, toJS } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"

import { broadcastToAllWindows, getAppThemeFromSystem } from "../../utils"
import { newOverlayManagerState, OverlaysState, OverlayMode } from "../../../common/models/overlays"
import { AppSettings } from "vrkit-models"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import { SharedAppStateSchema } from "vrkit-app-common/models/app"
import { serialize } from "serializr"
import {
  DashboardsState,
  newDashboardsState
} from "vrkit-app-common/models/dashboards"
import {
  newSessionsState, SessionsState
} from "vrkit-app-common/models/sessions"
import { BindAction } from "../../decorators"
import { isDev } from "../../constants"

const log = getLogger(__filename)

const { debug, trace, info, error, warn } = log



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

  @observable devSettings = newDevSettings()
  
  @observable sessions = newSessionsState()
  
  @observable overlays = newOverlayManagerState()
  
  @observable dashboards = newDashboardsState()

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
    const sharedAppStateJson = this.toJSON()
    const sharedAppStateObj = toJS(sharedAppStateJson)
    //info("Broadcasting shared app state", sharedAppStateObj)
    broadcastToAllWindows(ElectronIPCChannel.sharedAppStateChanged, sharedAppStateObj)
  }
  
  private unload() {
    ipcMain.removeHandler(ElectronIPCChannel.fetchSharedAppState)
    this.stopObserving?.()
  }
  
  @Once()
  private async init() {
    if (this.initDeferred) {
      return this.initDeferred.promise
    }
    this.initDeferred = new Deferred<MainSharedAppState>()
    try {
      makeObservable(this)
      this.stopObserving = deepObserve(this, this.onChange)
      ipcMain.handle(ElectronIPCChannel.fetchSharedAppState, this.fetchSharedAppStateHandler)
      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          warn(`HMR removing observer`)
          this.unload()
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

  @BindAction() setOverlays(state: OverlaysState) {
    this.overlays = state
  }

  @BindAction() updateOverlays(patch: Partial<OverlaysState>) {
    this.overlays = assign(cloneDeep(this.overlays), patch)
  }
  
  
  @BindAction() setSessions(state: SessionsState) {
    this.sessions = state
  }
  
  @BindAction() updateSessions(patch: Partial<SessionsState>) {
    set(this.sessions, patch)
    // entriesOf(patch).forEach(([key, value]) => {
    //   set(this.sessions, key, value)
    // })
    
  }
  
  
  @BindAction() setDashboards(state: DashboardsState) {
    this.dashboards = state
    return this.dashboards
  }
  
  @BindAction() updateDashboards(patch: Partial<DashboardsState>) {
    this.dashboards = assign(cloneDeep(this.dashboards), patch)
    return this.dashboards
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
    // info("Sending state js", stateJs)
    return stateJs
  }

  toJSON() {
    try {
      return serialize(SharedAppStateSchema, this)
    } catch (err) {
      log.error(`Error while serializing`, err)
      throw err
    }
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
  
  if (isDev) {
    global["appStore"] = store
  }
  return store
})
