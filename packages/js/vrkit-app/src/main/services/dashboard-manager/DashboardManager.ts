import { getLogger } from "@3fv/logger-proxy"
import { app, ipcMain, IpcMainInvokeEvent } from "electron"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { DashboardConfig } from "vrkit-models"
import { isDefined } from "@3fv/guard"
import { Disposables, isDev, isEmpty, Pair, removeIfMutation, SignalFlag } from "vrkit-app-common/utils"
import { DashboardManagerFnType, DashboardManagerFnTypeToIPCName } from "../../../common/models/dashboards"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import { AppPaths, FileExtensions } from "vrkit-app-common/constants"
import { AppSettingsService } from "../app-settings"
import Fsx from "fs-extra"
import { endsWith } from "lodash/fp"
import Path from "path"
import PQueue from "p-queue"
import { newDashboardTrackMapMockConfig } from "./DefaultDashboardConfig"
import { MainWindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import type { IArrayDidChange, IMapDidChange, IObjectDidChange } from "mobx"
import { set } from "mobx"
import { IDisposer } from "mobx-utils"
import { DashboardsState } from "vrkit-app-common/models"
import { defaultsDeep, first } from "lodash"
import { BindAction } from "../../decorators"

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

  get dashboardConfigs() {
    return this.state?.configs ?? []
  }
  
  get defaultDashboardId() {
    return this.mainAppState.appSettings.defaultDashboardConfigId
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

  private validateState(state: DashboardsState = this.state): DashboardsState {
    // CREATE A DEFAULT CONFIG IF NONE EXIST
    if (isEmpty(state.configs)) {
      const defaultConfig = DashboardConfig.create(newDashboardTrackMapMockConfig())
      this.saveDashboardConfigTaskFactory(defaultConfig).catch(err => {
        error("Failed to save default config", err)
      })

      state.configs.push(defaultConfig)
      return this.mainAppState.updateDashboards(state)
    }

    return state
  }

  getActiveOrDefaultDashboardConfig() {
    const state = this.validateState()
    const { activeDashboardConfig, activeDashboardId } = this
    if (activeDashboardConfig)
      return activeDashboardConfig
    
    const defaultDashboardConfigId = this.mainAppState.appSettings.defaultDashboardConfigId
    let config = this.dashboardConfigById(defaultDashboardConfigId)
    if (config)
      return config
      
    this.appSettingsService.changeSettings({
      defaultDashboardConfigId: state.configs[0].id
    })
  
  }

  /**
   * Create the initial state for the overlay manager
   *
   * @private
   */
  private async createInitialState(): Promise<DashboardsState> {
    const dashFiles = await Fsx.promises
      .readdir(dashDir)
      .then(files => files.filter(endsWith(FileExtensions.Dashboard)).map(f => Path.join(dashDir, f)))

    const configs = asOption<DashboardConfig[]>(
      await Promise.all(
        dashFiles.map(file =>
          Fsx.readJSON(file)
            .then(json => DashboardConfig.fromJson(json))
            .catch(err => {
              error(`Unable to read file ${file}`, err)
              return null
            })
        )
      )
    )
      .filter(isDefined)
      .getOrThrow()

    const state: DashboardsState = {
      configs,
      activeConfigId: "" //this.appSettingsService.appSettings?.activeDashboardId
    }

    return this.validateState(state)
  }

  @BindAction()
  async deleteDashboardConfig(id: string): Promise<DashboardConfig> {
    const removedDashConfigs = removeIfMutation(this.dashboardConfigs, dash => dash.id === id)

    await Promise.all(
      removedDashConfigs.map(config => this.persistQueue_.add(this.createDeleteDashboardConfigTask(config.id)))
    )

    return first(removedDashConfigs)
  }

  deleteDashboardConfigHandler(event: IpcMainInvokeEvent, id: string): Promise<DashboardConfig> {
    return this.deleteDashboardConfig(id).then(config => (!config ? null : (DashboardConfig.toJson(config) as any)))
  }

  @Bind
  private saveDashboardConfigTaskFactory(dashConfig: DashboardConfig) {
    return this.persistQueue_.add(this.createSaveDashboardConfigTask(dashConfig))
  }

  @BindAction()
  async updateDashboardConfig(id: string, patch: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const dashConfig = this.dashboardConfigs.find(it => it.id === id)
    if (!dashConfig) throw Error(`Unable to find dashboard with id(${id})`)
    set(dashConfig, patch)
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

  @BindAction()
  async createDashboardConfig(patch: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const newDashConfig = DashboardConfig.create(defaultsDeep(patch, newDashboardTrackMapMockConfig()))
    this.dashboardConfigs.push(newDashConfig)
    await this.saveDashboardConfigTaskFactory(newDashConfig)
    return newDashConfig
  }

  async createDashboardConfigHandler(
    event: IpcMainInvokeEvent,
    patch: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    return await this.createDashboardConfig(patch).then(dashConfig => DashboardConfig.toJson(dashConfig) as any)
  }

  @BindAction()
  async closeDashboard() {
    set(this.state, "activeConfigId", "")
  }

  async closeDashboardHandler(event: IpcMainInvokeEvent): Promise<void> {
    return await this.closeDashboard()
  }

  @BindAction()
  async openDashboard(id: string) {
    if (!this.dashboardConfigById(id)) throw Error(`Unable to find config for id (${id})`)

    set(this.state, "activeConfigId", id)
    return id
  }

  async openDashboardHandler(event: IpcMainInvokeEvent, id: string): Promise<string> {
    return await this.openDashboard(id)
  }

  async launchDashboardLayoutEditorHandler(event: IpcMainInvokeEvent, id: string): Promise<void> {
    // return this.dashboardConfigs.map(it => DashboardConfig.toJson(it) as any)
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

    app.on("before-quit", this.unload)

    const { sessionManager } = this,
      ipcFnHandlers = [
        [DashboardManagerFnType.LAUNCH_DASHBOARD_LAYOUT_EDITOR, this.launchDashboardLayoutEditorHandler.bind(this)],
        [DashboardManagerFnType.OPEN_DASHBOARD, this.openDashboardHandler.bind(this)],
        [DashboardManagerFnType.CLOSE_DASHBOARD, this.closeDashboardHandler.bind(this)],
        [DashboardManagerFnType.CREATE_DASHBOARD_CONFIG, this.createDashboardConfigHandler.bind(this)],
        [DashboardManagerFnType.UPDATE_DASHBOARD_CONFIG, this.updateDashboardConfigHandler.bind(this)],
        [DashboardManagerFnType.DELETE_DASHBOARD_CONFIG, this.deleteDashboardConfigHandler.bind(this)]
      ] as DashFnPair[]
    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(DashboardManagerFnTypeToIPCName(type), handler))
    if (isDev) {
      Object.assign(global, {
        dashboardsManager: this
      })
    }
    // In dev mode, make everything accessible
    this.disposers_.push(() => {
      if (this.stopObserving) {
        this.stopObserving()
      }
      ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(DashboardManagerFnTypeToIPCName(type)))
      app.off("before-quit", this.unload)

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
   */
  constructor(
    @InjectContainer() readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly mainWindowManager: MainWindowManager,
    readonly mainAppState: MainSharedAppState
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

      await Fsx.writeJSON(dashFile, DashboardConfig.toJson(config))
    }
  }

  dashboardConfigById(id: string): DashboardConfig {
    return this.dashboardConfigs.find(it => it.id === id)
  }
}

export default DashboardManager
