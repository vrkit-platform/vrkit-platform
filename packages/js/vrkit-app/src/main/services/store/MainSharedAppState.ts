import { Deferred } from "@3fv/deferred"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import {
  assign,
  Bind,
  DashboardsState,
  DevSettings,
  Disposables,
  ElectronIPCChannel,
  isEqual,
  ISharedAppState,
  ISharedAppStateLeaf,
  isValueSchema,
  newActionsState,
  newDashboardsState,
  newOverlaysState,
  newPluginsState,
  newSessionsState,
  Once,
  once,
  OverlaysState,
  SessionsState,
  SharedAppStateLeafNames,
  SharedAppStateLeafSchemas,
  SharedAppStateSchema,
  ThemeId
} from "vrkit-shared"
import { action, isObservable, makeObservable, observable, reaction, runInAction, set, toJS } from "mobx"
import { broadcastToAllWindows, getAppThemeFromSystem, IObserveChange } from "../../utils"
import { AppSettings } from "vrkit-models"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import { serialize } from "serializr"
import { AutoOpenDevToolsOverride, isDev } from "../../constants"
import type { PartialDeep } from "type-fest"
import { AppPaths, AppFiles, FileExtensions, type IAppPaths, type IAppStorage, type IAppFiles, type IFileExtensions } from "vrkit-shared/constants/node"
import { newDevSettings } from "vrkit-shared/models/node"

const log = getLogger(__filename)

const { debug, trace, info, error, warn } = log

@Singleton()
export class MainSharedAppState implements ISharedAppState {
  private initDeferred: Deferred<MainSharedAppState>

  private disposers_ = new Disposables()

  // private stopObserving: IDisposer

  private shutdownInProgress: boolean = false

  @observable systemTheme: ThemeId = getAppThemeFromSystem()

  /**
   * Get app settings from state
   */
  @observable appSettings: AppSettings = AppSettings.create()

  @observable devSettings = newDevSettings(AutoOpenDevToolsOverride ? { alwaysOpenDevTools: true } : {})

  @observable plugins = newPluginsState()

  @observable actions = newActionsState()

  @observable sessions = newSessionsState()

  @observable overlays: OverlaysState = newOverlaysState()

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
  private onChange(change: IObserveChange, path: string, root: any) {
    //private onChange(change: IObjectDidChange, ...other:any[]) {
    if (this.shutdownInProgress) {
      warn("Shutdown in progress, ignoring change")
      return
    }
    info(`onChange (path=${path})`)
    //info(`onChange`, change, "other args", other)

    // this.broadcast()
  }

  private broadcast(leaf: ISharedAppStateLeaf) {
    try {
      const schema = SharedAppStateLeafSchemas[leaf],
        json = isValueSchema(schema) ? schema.serialize(toJS(this[leaf])) : serialize(schema as any, toJS(this[leaf]))
      // const sharedAppStateJson = this.toJSON()
      // const sharedAppStateObj = toJS(sharedAppStateJson)
      // broadcastToAllWindows(ElectronIPCChannel.sharedAppStateChanged,
      // sharedAppStateObj)
      broadcastToAllWindows(ElectronIPCChannel.sharedAppStateChanged, leaf, toJS(json))
    } catch (err) {
      log.error(`Error while serializing`, err)
      throw err
    }
  }

  private unload() {
    ipcMain.removeHandler(ElectronIPCChannel.fetchSharedAppState)
    ipcMain.removeHandler(ElectronIPCChannel.fetchAppStorage)
    this.disposers_.dispose()
  }

  @Once()
  private async init() {
    if (this.initDeferred) {
      return this.initDeferred.promise
    }
    this.initDeferred = new Deferred<MainSharedAppState>()
    try {
      makeObservable(this)
      for (const leaf of SharedAppStateLeafNames) {
        if (!isObservable(this[leaf])) continue
        this.disposers_.push(
          reaction(
            () => toJS(this[leaf]),
            () => {
              log.info(`Root change detected on ${leaf}`)
              this.broadcast(leaf)
            },
            {
              equals: isEqual
            }
          )
        )
      }
      
      ipcMain.handle(ElectronIPCChannel.fetchSharedAppState, this.fetchSharedAppStateHandler)
      ipcMain.handle(ElectronIPCChannel.fetchAppStorage, this.fetchAppStorageHandler)
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
    this.disposers_.dispose()
  }

  @Bind @PostConstruct() whenReady() {
    return this.initDeferred.promise
  }

  @Bind
  setAppSettings(appSettings: AppSettings) {
    return runInAction(() => {
      set(this.appSettings, appSettings)
      return this.appSettings
    })
  }

  @Bind
  updateAppSettings(patch: Partial<AppSettings>) {
    return runInAction(() => {
      set(this.appSettings, patch)
      return this.appSettings
    })
  }

  @Bind
  setSessions(newSessions: SessionsState) {
    return runInAction(() => {
      set(this.sessions, newSessions)
      return this.sessions
    })
  }

  @Bind
  updateSessions(patch: Partial<SessionsState>) {
    return runInAction(() => {
      set(this.sessions, patch)
      return this.sessions
    })
  }

  @Bind
  setDashboards(state: DashboardsState) {
    return runInAction(() => {
      set(this.dashboards, state)
      return this.dashboards
    })
  }

  @Bind
  updateDashboards(patch: Partial<DashboardsState>) {
    return runInAction(() => {
      assign(this.dashboards, patch)
      return this.dashboards
    })
  }

  @Bind
  updateOverlays(patch: PartialDeep<OverlaysState>) {
    return runInAction(() => {
      this.overlays = assign({ ...this.overlays }, patch as any)
      return this.overlays
    })
  }

  @Bind
  updateDevSettings(patch: Partial<DevSettings>) {
    return runInAction(() => {
      assign(this.devSettings, patch)
      return this.devSettings
    })
  }

  @Bind
  setSystemTheme(theme: ThemeId) {
    return runInAction(() => {
      set(this, "systemTheme", theme)
      return this.systemTheme
    })
  }

  @Bind
  private async fetchSharedAppStateHandler(_ev: IpcMainInvokeEvent): Promise<ISharedAppState> {
    return toJS(this.toJSON())
  }
  
  @Bind
  private async fetchAppStorageHandler(_ev: IpcMainInvokeEvent): Promise<IAppStorage> {
    return {paths:AppPaths, files: AppFiles, fileExtensions: FileExtensions}
  }

  toJSON() {
    try {
      return serialize(SharedAppStateSchema, toJS(this))
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
