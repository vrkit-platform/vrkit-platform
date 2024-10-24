import { Deferred } from "@3fv/deferred"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { Bind, newPluginsState, Once } from "vrkit-shared"
import {
  DevSettings,
  ISharedAppState,
  newDevSettings,
  newOverlaysState,
  OverlaysState,
  ThemeId
} from "vrkit-shared"
import { assign, once } from "vrkit-shared"
import { makeObservable, observable, set, toJS } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"

import { broadcastToAllWindows, getAppThemeFromSystem } from "../../utils"
import { AppSettings } from "vrkit-models"
import { ElectronIPCChannel } from "vrkit-shared"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import { SharedAppStateSchema } from "vrkit-shared"
import { serialize } from "serializr"
import { DashboardsState, newDashboardsState } from "vrkit-shared"
import { newSessionsState, SessionsState } from "vrkit-shared"
import { BindAction } from "../../decorators"
import { AutoOpenDevToolsOverride, isDev } from "../../constants"
import { newActionsState } from "vrkit-shared"

const log = getLogger(__filename)

const { debug, trace, info, error, warn } = log

@Singleton()
export class MainSharedAppState implements ISharedAppState {
  private initDeferred: Deferred<MainSharedAppState>

  private stopObserving: IDisposer

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
    set(this.appSettings, appSettings)
    return this.appSettings
  }

  @BindAction() updateAppSettings(patch: Partial<AppSettings>) {
    assign(this.appSettings, patch)
    return this.appSettings
  }

  @BindAction() setSessions(newSessions: SessionsState) {
    set(this.sessions, newSessions)
    return this.sessions
  }

  @BindAction() updateSessions(patch: Partial<SessionsState>) {
    assign(this.sessions, patch)
    return this.sessions
  }

  @BindAction() setDashboards(state: DashboardsState) {
    set(this.dashboards, state)
    return this.dashboards
  }

  @BindAction() updateDashboards(patch: Partial<DashboardsState>) {
    assign(this.dashboards, patch)
    return this.dashboards
  }

  @BindAction() updateDevSettings(patch: Partial<DevSettings>) {
    assign(this.devSettings, patch)
    return this.devSettings
  }

  @BindAction() setSystemTheme(theme: ThemeId) {
    set(this, "systemTheme", theme)
    return this.systemTheme
  }

  @Bind
  private async fetchSharedAppStateHandler(_ev: IpcMainInvokeEvent): Promise<ISharedAppState> {
    return this.toJSON()
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
