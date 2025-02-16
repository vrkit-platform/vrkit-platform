import { getLogger } from "@3fv/logger-proxy"
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron"
import type { OverlayManager as OverlayManagerType } from "../overlay-manager/OverlayManager"
import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  assert,
  Bind,
  ConvertVRSizeToScreenRect,
  DashboardManagerFnType,
  DashboardManagerFnTypeToIPCName,
  DashboardsState,
  Disposables,
  isEmpty,
  isNotEmpty,
  isNotEmptyString,
  notInList,
  Pair,
  removeIfMutation,
  SignalFlag,
  WindowMetadata,
  WindowRole
} from "@vrkit-platform/shared"
import { DashboardConfig, IsValidId } from "@vrkit-platform/models"
import { getValue, guard, isDefined, isString } from "@3fv/guard"
import { SessionManager } from "../session-manager"
import { asOption } from "@3fv/prelude-ts"
import { AppPaths, FileExtensions } from "@vrkit-platform/shared/constants/node"
import { AppSettingsService } from "../app-settings"
import Fsx from "fs-extra"
import { endsWith, get } from "lodash/fp"
import Path from "path"
import PQueue from "p-queue"
import { newDashboardTrackMapMockConfig } from "./DefaultDashboardConfig"
import { WindowMainInstance, WindowManager } from "../window-manager"
import { MainSharedAppState } from "../store"
import { action, runInAction, set, toJS } from "mobx"
import { IDisposer } from "mobx-utils"
import { assign, first } from "lodash"
import { FileSystemManager } from "@vrkit-platform/shared/services/node"
import { getService } from "../../ServiceContainer"
import { StateReaction } from "../../utils"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const dashDir = AppPaths.dashboardsDir

type DashFnPair = Pair<DashboardManagerFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>

function getOverlayManager(): OverlayManagerType {
  const OverlayManager = require("../overlay-manager/OverlayManager").OverlayManager as typeof OverlayManagerType
  return getService(OverlayManager) as OverlayManagerType
}

export interface DashboardStateSummary {
  activeDashboardId: string

  editorEnabled: boolean

  vrEnabled: boolean

  windowMetadata: {
    controller: WindowMetadata
    vrLayout: WindowMetadata
  }
}

@Singleton()
export class DashboardManager {
  private persistQueue_ = new PQueue({
    concurrency: 1
  })

  private dashboardWindowsQueue_ = new PQueue({
    concurrency: 1
  })

  private readonly disposers_ = new Disposables()

  private stopObserving: IDisposer = null

  private readonly shutdownFlag_ = SignalFlag.new()

  get state(): DashboardsState {
    return this.appState.dashboards
  }

  get isShutdown() {
    return this.shutdownFlag_.isSet
  }

  /**
   * Checks if the editor is currently enabled.
   *
   * @return {boolean} Returns true if the editor is enabled, otherwise false.
   */
  get isEditorEnabled(): boolean {
    return this.appState.overlays?.editor?.enabled === true
  }
  
  get vrLayoutWindowInstance() {
    return first(this.windowManager.getByRole(WindowRole.DashboardVRLayout))
  }
  
  get controllerWindowInstance() {
    return first(this.windowManager.getByRole(WindowRole.DashboardController))
  }
  
  
  get dashboardConfigs(): DashboardConfig[] {
    return this.state?.configs ?? []
  }

  get defaultDashboardConfig() {
    return this.getDashboardConfigById(this.defaultDashboardId)
  }

  get defaultDashboardId() {
    return this.appState.appSettings.defaultDashboardConfigId
  }

  get defaultDashboardConfigIsValid() {
    return isNotEmpty(this.defaultDashboardId) && !!this.getDashboardConfigById(this.defaultDashboardId)
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
      const defaultConfig = DashboardConfig.create(
        newDashboardTrackMapMockConfig({ name: this.nextDashboardConfigName() })
      )
      this.saveDashboardConfigTaskFactory(defaultConfig).catch(err => {
        error("Failed to save default config", err)
      })

      state.configs.push(defaultConfig)
      state = this.appState.updateDashboards(state)
    }

    if (!this.defaultDashboardConfigIsValid) {
      const config = first(state.configs)
      log.assert(isDefined(config) && isNotEmpty(config.id), "No dashboard configs exist after it was just checked")
      this.appSettingsService.changeSettings({
        defaultDashboardConfigId: config.id
      })
    }

    log.assert(
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
            .then(json =>
              assign(DashboardConfig.fromJson(json), {
                id: Path.basename(file, FileExtensions.Dashboard)
              })
            )
            .then(config => this.fsManager.getFileInfo(file).then(fileInfo => assign(config, { fileInfo })))
            .then(config => {
              if (config.vrEnabled) {
                for (const placement of config.placements) {
                  if (placement.vrLayout?.size && placement.vrLayout?.pose) {
                    placement.vrLayout.screenRect = ConvertVRSizeToScreenRect(placement.vrLayout.size)
                  }
                }
              }

              return config
            })
            .catch(err => {
              error(`Unable to read/parse file (${file}), deleting`, err)
              getValue(
                () => Fsx.unlinkSync(file),
                null,
                err => error(`Failed to remove file ${file}`, err)
              )
              return null
            })
        )
      )
    )
      .map(configs => configs.filter(isDefined))
      .filter(isDefined)
      .getOrThrow()

    const configIds = new Set<string>()
    configs.forEach(({ id }) => {
      assert(!configIds.has(id))
      configIds.add(id)
    })

    return runInAction(() => {
      this.appState.dashboards = {
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

  /**
   * Updates the configuration for a specified dashboard by applying a partial
   * update. Fetches the dashboard configuration by id, applies the patch, and
   * saves the updated configuration.
   *
   * @param {string} id - The unique identifier of the dashboard to update.
   * @param {Partial<DashboardConfig>} patch - An object containing the partial
   *     updates to apply to the dashboard configuration.
   * @return {Promise<DashboardConfig>} A promise that resolves with the
   *     updated dashboard configuration object.
   */
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

    return toJS(DashboardConfig.toJson(dashConfig)) as any
  }

  /**
   * Handles the update of the dashboard configuration by applying a patch.
   *
   * @param {IpcMainInvokeEvent} _event - The IPC event that triggered the
   *     handler.
   * @param {string} id - The unique identifier of the dashboard configuration
   *     to be updated.
   * @param {Partial<DashboardConfig>} patch - The partial updates to be
   *     applied to the dashboard configuration.
   * @return {Promise<DashboardConfig>} A promise that resolves to the updated
   *     dashboard configuration.
   */
  updateDashboardConfigHandler(
    _event: IpcMainInvokeEvent,
    id: string,
    patch: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    return this.updateDashboardConfig(id, patch)
  }

  /**
   * Generate a new dashboard name
   */
  nextDashboardConfigName() {
    const { dashboardConfigs: configs } = this,
      nameSuffix = configs.length ? ` (${configs.length + 1})` : ""
    return `Dashboard${nameSuffix}`
  }

  @Bind
  async createDashboardConfig(patch: Partial<DashboardConfig> = {}): Promise<DashboardConfig> {
    const { dashboardConfigs: configs } = this,
      nameSuffix = configs.length ? ` ${configs.length + 1}` : ""
    patch.name = asOption(patch?.name)
      .filter(isNotEmptyString)
      .filter(notInList(configs.map(get("name"))))
      .getOrCall(() => `My Dashboard${nameSuffix}`)
    const dashConfig = newDashboardTrackMapMockConfig(patch)
    await this.saveDashboardConfigTaskFactory(dashConfig)
    runInAction(() => {
      this.dashboardConfigs.push(dashConfig)
    })

    return dashConfig
  }

  /**
   * Handles the creation of a new dashboard configuration based on a partial
   * patch object. Logs the created dashboard configuration and returns it in
   * JSON format.
   *
   * @param _event - The event triggered by the IPC main process invoke.
   * @param patch - A partial object containing fields to be updated or created
   *     in the dashboard configuration.
   * @return A Promise that resolves with the complete dashboard configuration
   *     object in JSON format.
   */
  async createDashboardConfigHandler(
    _event: IpcMainInvokeEvent,
    patch: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    const dashConfig = await this.createDashboardConfig(patch),
      dashConfigJson = toJS(DashboardConfig.toJson(dashConfig)) as any

    log.info(`Created new dash config`, dashConfigJson)
    return dashConfigJson
  }

  /**
   * Closes the currently active dashboard, if any.
   * This method checks if there is an active dashboard ID before proceeding.
   * If no active dashboard exists, a log message is generated, and the
   * operation is aborted. Otherwise, it resets the active dashboard
   * configuration state.
   *
   * @return {Promise<void>} Resolves when the dashboard closure process is
   *     complete.
   */
  @Bind
  async closeDashboard(): Promise<void> {
    await this.dashboardWindowsQueue_.add(async (): Promise<string> => {
      if (!this.activeDashboardId || isEmpty(this.activeDashboardId)) {
        log.info(`No active dashboard to close`)
        return
      }
      runInAction(() => {
        set(this.state, "activeConfigId", "")
      })
      
      this.scheduleDashboardWindowsCheck()
    })
  }

  async closeDashboardHandler(event: IpcMainInvokeEvent): Promise<void> {
    return await this.closeDashboard()
  }

  /**
   * Opens a dashboard with the given identifier. If the specified dashboard is
   * already open, the method returns the ID without reopening it. If another
   * dashboard is active, it closes the currently active dashboard before
   * opening the new one. Updates the state with the new active dashboard
   * config ID.
   *
   * @param {string} id - The identifier of the dashboard to be opened.
   * @return {Promise<string>} A promise that resolves to the ID of the opened
   *     dashboard.
   */
  @Bind
  async openDashboard(id: string): Promise<string> {
    const newId = await this.dashboardWindowsQueue_.add(async (): Promise<string> => {
      let { activeDashboardId } = this
  
      if (id === activeDashboardId) {
        log.info(`Dashboard is already open (${id})`)
        return id
      }
  
      if (isNotEmptyString(activeDashboardId)) {
        await this.closeDashboard()
        activeDashboardId = this.activeDashboardId
        log.assert(
          !activeDashboardId || isEmpty(activeDashboardId),
          `Expected no active dashboard id, but found (${activeDashboardId})`
        )
      }
  
      return runInAction(() => {
        log.assert(!!this.getDashboardConfigById(id), `Unable to find config for id (${id})`)
  
        set(this.state, "activeConfigId", id)
        this.scheduleDashboardWindowsCheck()
        
        return id
      })
    })
    
    return isString(newId) ? newId : id
  }

  async openDashboardHandler(event: IpcMainInvokeEvent, id: string): Promise<string> {
    return await this.openDashboard(id)
  }

  async launchDashboardVRLayoutEditorHandler(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      log.assert(
          isNotEmptyString(this.activeDashboardId),
          `A dashboard must be open with VR enabled in order to open the VR layout editor`
      )
      
      await this.executeDashboardWindowsCheck()
      
      if (this.vrLayoutWindowInstance) {
        log.warn(`vrLayoutEditor already created/opened`)
        return
      }
      
      log.info(`vrLayoutEditor opening`)
      await this.windowManager.create(WindowRole.DashboardVRLayout)
      log.info(`vrLayoutEditor opened`)
    } catch (err) {
      log.error(`Failed to launch (vr layout editor)`, err)
    }
  }

  @Bind
  private async onMainWindowReady(_windowInstance: WindowMainInstance) {
    if (!this.appState.appSettings.openDashboardOnLaunch) {
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

  async [Symbol.asyncDispose]() {
    this[Symbol.dispose]()
  }

  /**
   * Cleanup resources on unload
   *
   * @param _event
   * @private
   */
  @Bind
  private async unload(_event: Electron.Event = null): Promise<any> {
    await ((this[Symbol.asyncDispose] as any)() as Promise<any>)
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  protected async init(): Promise<void> {
    this.appState.setDashboards(await this.createInitialState())
    //
    // app.on("quit", this.unload)

    const { windowManager, sessionManager } = this,
      ipcFnHandlers = [
        [DashboardManagerFnType.LAUNCH_DASHBOARD_VR_LAYOUT_EDITOR, this.launchDashboardVRLayoutEditorHandler.bind(this)],
        [DashboardManagerFnType.OPEN_DASHBOARD, this.openDashboardHandler.bind(this)],
        [DashboardManagerFnType.CLOSE_DASHBOARD, this.closeDashboardHandler.bind(this)],
        [DashboardManagerFnType.CREATE_DASHBOARD_CONFIG, this.createDashboardConfigHandler.bind(this)],
        [DashboardManagerFnType.UPDATE_DASHBOARD_CONFIG, this.updateDashboardConfigHandler.bind(this)],
        [DashboardManagerFnType.DELETE_DASHBOARD_CONFIG, this.deleteDashboardConfigHandler.bind(this)]
      ] as DashFnPair[]
    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(DashboardManagerFnTypeToIPCName(type), handler))

    windowManager.once("MAIN_WINDOW_READY", this.onMainWindowReady)

    if (isDev) {
      Object.assign(global, {
        dashboardsManager: this
      })
    }
    // In dev mode, make everything accessible
    this.disposers_.push(
      StateReaction(
        () => this.getDashboardStateSummary(),
        () => {
          this.scheduleDashboardWindowsCheck()
        }
      ),
      () => {
        windowManager.off("MAIN_WINDOW_READY", this.onMainWindowReady)

        if (this.stopObserving) {
          this.stopObserving()
        }
        
        ipcFnHandlers.forEach(([type, handler]) => ipcMain.removeHandler(DashboardManagerFnTypeToIPCName(type)))
        app.off("quit", this.unload)

        Object.assign(global, {
          dashboardsManager: undefined
        })
      }
    )

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
   * @param windowManager
   * @param appState
   * @param fsManager
   */
  constructor(
    @InjectContainer()
    readonly container: Container,
    readonly sessionManager: SessionManager,
    readonly appSettingsService: AppSettingsService,
    readonly windowManager: WindowManager,
    readonly appState: MainSharedAppState,
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

      await this.fsManager.getFileInfo(dashFile).then(fileInfo => runInAction(() => assign(config, { fileInfo })))
    }
  }

  /**
   * Retrieves the dashboard configuration for the specified ID.
   *
   * @param {string} id - The unique identifier for the dashboard
   *     configuration.
   * @return {DashboardConfig} The dashboard configuration corresponding to the
   *     provided ID.
   */
  getDashboardConfigById(id: string): DashboardConfig {
    return this.dashboardConfigs.find(it => it.id === id)
  }

  /**
   * Retrieves the active dashboard details including whether the editor is
   * enabled, the active dashboard ID, controller window metadata, and VR
   * enable state.
   *
   * @return {DashboardStateSummary} An object containing the details of the
   *     active dashboard.
   */
  getDashboardStateSummary(): DashboardStateSummary {
    return {
      editorEnabled: this.appState.overlays?.editor?.enabled === true,
      windowMetadata: {
        controller: this.appState.desktopWindows?.windows?.[WindowRole.DashboardController],
        vrLayout: this.appState.desktopWindows?.windows?.[WindowRole.DashboardVRLayout]
      },
      activeDashboardId: this.activeDashboardId,
      vrEnabled: this.activeDashboardConfig?.vrEnabled === true
    }
  }

  private scheduleDashboardWindowsCheck(): void {
    log.info(`Scheduling DashboardWindows check`)
    this.executeDashboardWindowsCheck().catch(err => {
      log.error(`Unable to executeDashboardWindowsCheck`, err)
    })
  }

  private async executeDashboardWindowsCheck(): Promise<void> {
    await this.dashboardWindowsQueue_.add(async () => {
      try {
        const summary: DashboardStateSummary = this.getDashboardStateSummary()
          let winController = this.controllerWindowInstance,
          winVRLayout = this.vrLayoutWindowInstance,
          wins = [winController, winVRLayout].filter(isDefined)

        if (!IsValidId(summary.activeDashboardId)) {
          log.info(`No active dashboard, closing windows (${wins.map(get("id")).join(",")})`)
          wins.forEach(win => this.windowManager.close(win))
          return
        }

        if (winVRLayout && !summary.vrEnabled) {
          log.info(
            `Closing VR layout editor because active dash doesn't have vr enabled (${summary.activeDashboardId})`
          )
          guard(() => this.windowManager.close(winVRLayout))
        }
        
        winController = this.controllerWindowInstance
        if (winController)
          return
        
        log.info(`executeDashboardWindowsCheck: Creating Dashboard Controller Window`)
        await this.windowManager.create(WindowRole.DashboardController)
        log.info(`executeDashboardWindowsCheck: Created Dashboard Controller Window`)
      
      } catch (err) {
        log.error(`FAILED TO UPDATE DASHBOARD WINDOWS`, err)
      }
    })
  }
}

export default DashboardManager
