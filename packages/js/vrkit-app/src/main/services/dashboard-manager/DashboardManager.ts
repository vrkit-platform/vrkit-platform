import { getLogger } from "@3fv/logger-proxy"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  assert,
  Bind,
  DashboardManagerFnType,
  DashboardManagerFnTypeToIPCName,
  DashboardsState,
  Disposables,
  isDev,
  isEmpty,
  isNotEmpty,
  Pair,
  removeIfMutation,
  SignalFlag
} from "vrkit-shared"
import { DashboardConfig } from "vrkit-models"
import { isDefined } from "@3fv/guard"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import { AppPaths, FileExtensions } from "vrkit-shared/constants/node"
import { AppSettingsService } from "../app-settings"
import Fsx from "fs-extra"
import { endsWith } from "lodash/fp"
import Path from "path"
import PQueue from "p-queue"
import { newDashboardTrackMapMockConfig } from "./DefaultDashboardConfig"
import { MainWindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { action, runInAction, set } from "mobx"
import { IDisposer } from "mobx-utils"
import { assign, defaultsDeep, first } from "lodash"
import { FileSystemManager } from "vrkit-shared/services/node"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

type DashFnPair = Pair<DashboardManagerFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>

@Singleton()
export class DashboardManager {
  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  private readonly disposers_ = new Disposables()

  private stopObserving: IDisposer = null

  private readonly shutdownFlag_ = SignalFlag.new()

  get state(): DashboardsState {
    return this.mainAppState.dashboards
  }

  get isShutdown() {
    return this.shutdownFlag_.isSet
  }

  get dashboardConfigs(): DashboardConfig[] {
    return this.state?.configs ?? []
  }

  get defaultDashboardConfig() {
    return this.dashboardConfigById(this.defaultDashboardId)
  }

  get defaultDashboardId() {
    return this.mainAppState.appSettings.defaultDashboardConfigId
  }

  get defaultDashboardConfigIsValid() {
    return isNotEmpty(this.defaultDashboardId) && !!this.dashboardConfigById(this.defaultDashboardId)
  }

  get activeDashboardId() {
    return this.state.activeConfigId
  }

  get activeDashboardConfig(): DashboardConfig {
    this.validateState()

    return asOption(this.activeDashboardId)
      .map(id => this.dashboardConfigs.find(it => it.id === id))
      .getOrNull() as DashboardConfig
  }

  /**
   * Verify & validate `DashboardsState`
   * @param state
   * @private
   */
  @action
  @Bind
  private validateState(state: DashboardsState = this.state): DashboardsState {
    // CREATE A DEFAULT CONFIG IF NONE EXIST
    if (isEmpty(state.configs)) {
      const defaultConfig = DashboardConfig.create(newDashboardTrackMapMockConfig())
      this.saveDashboardConfigTaskFactory(defaultConfig).catch(err => {
        error("Failed to save default config", err)
      })

      state.configs.push(defaultConfig)
      state = this.mainAppState.updateDashboards(state)
    }

    if (!this.defaultDashboardConfigIsValid) {
      const config = first(state.configs)
      assert(isDefined(config) && isNotEmpty(config.id), "No dashboard configs exist after it was just checked")
      this.appSettingsService.changeSettings({
        defaultDashboardConfigId: config.id
      })
    }

    assert(
      this.defaultDashboardConfigIsValid,
      "this.defaultDashboardConfigIsValid is false, but should've been resolved"
    )

    return state
  }

  /**
   * Get either the active dashboard config or
   * the default dashboard config
   */
  getActiveOrDefaultDashboardConfig(): DashboardConfig {
    this.validateState()
    return asOption(this.activeDashboardConfig).getOrCall(() => this.defaultDashboardConfig)
  }

  /**
   * Create the initial state for the overlay manager
   *
   * @private
   */
  @Bind
  private async createInitialState(): Promise<DashboardsState> {
    const dashFiles = await Fsx.promises
      .readdir(dashDir)
      .then(files => files.filter(endsWith(FileExtensions.Dashboard)).map(f => Path.join(dashDir, f)))

    const configs = asOption<DashboardConfig[]>(
      await Promise.all(
        dashFiles.map(file =>
          Fsx.readJSON(file)
            .then(json => DashboardConfig.fromJson(json))
            .then(config => this.fsManager.getFileInfo(file).then(fileInfo => assign(config, { fileInfo })))
            .catch(err => {
              error(`Unable to read file ${file}`, err)
              return null
            })
        )
      )
    )
      .filter(isDefined)
      .getOrThrow()

    return runInAction(() => {
      this.mainAppState.dashboards = {
        ...this.state,
        configs,
        activeConfigId: ""
      }

      return this.validateState()
    })
  }

  @Bind
  async deleteDashboardConfig(id: string): Promise<DashboardConfig> {
    const removedDashConfigs = runInAction(() => removeIfMutation(this.dashboardConfigs, dash => dash.id === id))

    await Promise.all(
      removedDashConfigs.map(config => this.persistQueue_.add(this.createDeleteDashboardConfigTask(config.id)))
    )

    return first(removedDashConfigs)
  }

  async deleteDashboardConfigHandler(event: IpcMainInvokeEvent, id: string): Promise<DashboardConfig> {
    return await this.deleteDashboardConfig(id).then(config =>
      !config ? null : (DashboardConfig.toJson(config) as any)
    )
  }

  @Bind
  private saveDashboardConfigTaskFactory(dashConfig: DashboardConfig) {
    return this.persistQueue_.add(this.createSaveDashboardConfigTask(dashConfig))
  }

  @Bind
  async updateDashboardConfig(id: string, patch: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const dashConfig = runInAction(() => {
      const dashConfig = this.dashboardConfigs.find(it => it.id === id)
      if (!dashConfig) {
        throw Error(`Unable to find dashboard with id(${id})`)
      }
      set(dashConfig, patch)

      return dashConfig
    })

    await this.saveDashboardConfigTaskFactory(dashConfig)
    return dashConfig
  }

  updateDashboardConfigHandler(
    event: IpcMainInvokeEvent,
    id: string,
    patch: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    return this.updateDashboardConfig(id, patch)
  }

  @Bind
  async createDashboardConfig(patch: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const dashConfig = runInAction(() => {
      const newDashConfig = DashboardConfig.create(defaultsDeep(patch, newDashboardTrackMapMockConfig()))
      this.dashboardConfigs.push(newDashConfig)
      return newDashConfig
    })

    await this.saveDashboardConfigTaskFactory(dashConfig)
    return dashConfig
  }

  async createDashboardConfigHandler(
    event: IpcMainInvokeEvent,
    patch: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    return await this.createDashboardConfig(patch).then(dashConfig => DashboardConfig.toJson(dashConfig) as any)
  }

  @Bind
  async closeDashboard() {
    runInAction(() => {
      set(this.state, "activeConfigId", "")
    })
  }

  async closeDashboardHandler(event: IpcMainInvokeEvent): Promise<void> {
    return await this.closeDashboard()
  }

  @Bind
  async openDashboard(id: string) {
    return runInAction(() => {
      if (!this.dashboardConfigById(id)) {
        throw Error(`Unable to find config for id (${id})`)
      }

      set(this.state, "activeConfigId", id)
      return id
    })
  }

  async openDashboardHandler(event: IpcMainInvokeEvent, id: string): Promise<string> {
    return await this.openDashboard(id)
  }

  async launchDashboardLayoutEditorHandler(event: IpcMainInvokeEvent, id: string): Promise<void> {
    // return this.dashboardConfigs.map(it => DashboardConfig.toJson(it) as any)
  }

  @Bind
  private async onUIReady(win: BrowserWindow) {
    if (!this.mainAppState.appSettings.openDashboardOnLaunch) {
      log.info(`open dash on launch is not enabled`)
      return
    }
    await asOption(this.getActiveOrDefaultDashboardConfig()).match({
      Some: dash => this.openDashboard(dash.id),
      None: () => {
        warn(
          `appSettings.openDashboardOnLaunch is set, but not valid default dashboard was found`,
          this.activeDashboardId
        )
        return Promise.resolve<string>(null)
      }
    })
  }

  [Symbol.dispose]() {
    debug(`Unloading DashboardManager`)

    this.disposers_.dispose()
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private async unload(event: Electron.Event = null) {
    this[Symbol.dispose]()
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    this.mainAppState.setDashboards(await this.createInitialState())
    //this.checkActiveDashboardConfig()

    app.on("quit", this.unload)

    const { mainWindowManager, sessionManager } = this,
      ipcFnHandlers = [
        [DashboardManagerFnType.LAUNCH_DASHBOARD_LAYOUT_EDITOR, this.launchDashboardLayoutEditorHandler.bind(this)],
        [DashboardManagerFnType.OPEN_DASHBOARD, this.openDashboardHandler.bind(this)],
        [DashboardManagerFnType.CLOSE_DASHBOARD, this.closeDashboardHandler.bind(this)],
        [DashboardManagerFnType.CREATE_DASHBOARD_CONFIG, this.createDashboardConfigHandler.bind(this)],
        [DashboardManagerFnType.UPDATE_DASHBOARD_CONFIG, this.updateDashboardConfigHandler.bind(this)],
        [DashboardManagerFnType.DELETE_DASHBOARD_CONFIG, this.deleteDashboardConfigHandler.bind(this)]
      ] as DashFnPair[]
    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(DashboardManagerFnTypeToIPCName(type), handler))

    mainWindowManager.on("UI_READY", this.onUIReady)

    if (isDev) {
      Object.assign(global, {
        dashboardsManager: this
      })
    }
    // In dev mode, make everything accessible
    this.disposers_.push(() => {
      mainWindowManager.off("UI_READY", this.onUIReady)

      if (this.stopObserving) {
        this.stopObserving()
      }
      ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(DashboardManagerFnTypeToIPCName(type)))
      app.off("quit", this.unload)

      Object.assign(global, {
        overlayManager: undefined
      })
    })

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.unload()
      })
    }
  }

  /**
   * Service constructor
   *
   * @param container
   * @param sessionManager
   * @param appSettingsService
   * @param mainWindowManager
   * @param mainAppState
   * @param fsManager
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: MainWindowManager,
    readonly mainAppState: MainSharedAppState,
    readonly fsManager: FileSystemManager
  ) {}

  /**
   * Create a delete dashboard config task
   *
   * @param id
   * @private
   */
  private createDeleteDashboardConfigTask(id: string) {
    return async () => {
      const dashFile = Path.join(AppPaths.dashboardsDir, id + FileExtensions.Dashboard)
      info(`Deleting dashboard ${dashFile}`)

      await Fsx.unlink(dashFile)
    }
  }

  private createSaveDashboardConfigTask(config: DashboardConfig) {
    return async () => {
      const dashFile = Path.join(AppPaths.dashboardsDir, config.id + FileExtensions.Dashboard)
      info(`Saving dashboard ${dashFile}`)

      await Fsx.writeJSON(
        dashFile,
        DashboardConfig.toJson(config, {
          emitDefaultValues: true
        })
      )
    }
  }

  dashboardConfigById(id: string): DashboardConfig {
    return this.dashboardConfigs.find(it => it.id === id)
  }
}

export default DashboardManager
