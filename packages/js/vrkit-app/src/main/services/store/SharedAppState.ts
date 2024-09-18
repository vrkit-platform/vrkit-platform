import { Deferred } from "@3fv/deferred"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { applyDecorators, Bind, Once } from "vrkit-app-common/decorators"
import { ISharedAppState, ThemeId } from "vrkit-app-common/models"
import { once } from "vrkit-app-common/utils"
import { action, makeObservable, observable, toJS } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"


import { broadcastToAllWindows, fileExists, getAppThemeFromSystem, readObjectFile } from "../../utils"
import { OverlayMode } from "vrkit-app-common/models/overlay-manager"
import { AppSettings, ThemeType } from "vrkit-models"
import { isString } from "@3fv/guard"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import { pick } from "lodash"

const log = getLogger(__filename)

const { debug, trace, info, error, warn } = log
const BindAction = () => applyDecorators(Bind, action)

// const [sharedAppStateSchema, sharedAppStateFile] = FileStorage.files.state

@Singleton()
export class SharedAppState implements AppSettings, ISharedAppState {
  private initDeferred: Deferred<SharedAppState>

  private stopObserving: IDisposer

  private shutdownInProgress: boolean = false

  @observable zoomFactor: number = 1.0

  @observable customAccelerators: Record<string, string> = {}

  @observable themeType: ThemeType = null

  @observable systemTheme: ThemeId = getAppThemeFromSystem()

  @observable overlayMode: OverlayMode = OverlayMode.NORMAL

  @observable activeDashboardId: string = null

  @observable autoconnect: boolean = false
  
  toJSON() {
    return pick(this, "zoomFactor", "themeType", "systemTheme", "overlayMode", "activeDashboardId", "autoconnect")
  }
  
  get theme(): ThemeId {
    return (isString(this.themeType) ? this.themeType : ThemeType[this.themeType]) as ThemeId
  }

  /**
   * Get app settings from state
   */
  get appSettings(): AppSettings {
    return AppSettings.create({
      autoconnect: this.autoconnect,
      themeType: this.themeType ?? ThemeType.AUTO,
      activeDashboardId: this.activeDashboardId,
      zoomFactor: this.zoomFactor
    })
  }

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
    this.initDeferred = new Deferred<SharedAppState>()
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

  @BindAction() setZoomFactor(zoomFactor: number) {
    this.zoomFactor = zoomFactor
  }
  
  @BindAction() setOverlayMode(overlayMode: OverlayMode) {
    this.overlayMode = overlayMode
  }

  @BindAction() setTheme(theme: ThemeId) {
    this.themeType = isString(theme) ? ThemeType[theme] : theme
  }

  @BindAction() setSystemTheme(theme: ThemeId) {
    this.systemTheme = theme
  }

  @BindAction() setAppSettings(settings: AppSettings) {
    Object.assign(this, settings)
  }

  @Bind
  private async fetchSharedAppStateHandler(_ev: IpcMainInvokeEvent):Promise<ISharedAppState> {
    const stateJs = toJS(this.toJSON())
    info("Sending state js", stateJs)
    return stateJs
  }
}

const instanceDeferred = new Deferred<SharedAppState>()

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
  const store = new SharedAppState()
  await store.whenReady().then(
    () => instanceDeferred.resolve(store),
    err => {
      instanceDeferred.reject(err)
      throw err
    }
  )
  return store
})
