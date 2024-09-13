import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { ipcMain, webContents } from "electron"

import { Future } from "@3fv/prelude-ts"
import { ErrorKind, throwError } from "vrkit-app-common/utils"
import { Bind } from "vrkit-app-common/decorators"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"
import { AppSettings } from "vrkit-models"
import { AppFiles } from "vrkit-app-common/constants"
import Fs from "fs"
import PQueue from "p-queue"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

interface AppSettingsServiceState {
  appSettings: AppSettings
}

@Singleton()
export class AppSettingsService {
  private readonly saveQueue_ = new PQueue({
    concurrency: 1
  })
  
  private state: AppSettingsServiceState = {
    appSettings: AppSettings.create()
  }
  
  private patchSettings(settings:Partial<AppSettings>):AppSettings {
    const patched = this.state.appSettings = AppSettings.create({ ...this.state.appSettings, ...settings })
    this.saveAppSettings(patched)
    return patched
  }

  @Bind
  private onGetAppSettingsSync(event: Electron.IpcMainEvent) {
    event.returnValue = this.state.appSettings
  }

  @Bind
  private onSaveAppSettingsSync(event: Electron.IpcMainEvent, newSettings: Partial<AppSettings>) {
    let result: AppSettings | ErrorKind
    try {
      result = this.patchSettings(newSettings)
    } catch (err) {
      error(`Failed to save app settings`, err)
      result = err
    }
    event.returnValue = result
  }

  /**
   * Responder
   *
   * @param event
   * @returns
   */
  @Bind
  private async onGetAppSettings(event: Electron.IpcMainInvokeEvent) {
    return this.state.appSettings
  }

  /**
   * Responder
   *
   * @param _event
   * @param settings
   */
  @Bind
  private onSaveAppSettings(_event: Electron.IpcMainInvokeEvent, settings: Partial<AppSettings>) {
    return this.patchSettings(settings)
  }

  /**
   * On state change, emit to renderers
   *
   */
  @Bind
  private broadcastAppSettingsChange() {
    const {appSettings} = this

    webContents.getAllWebContents().forEach(webContent => {
      webContent.send(ElectronIPCChannel.settingsChanged, appSettings)
    })
  }

  /**
   * Initialize
   */
  @PostConstruct()
  private async init() {
    this.state = {
      ...this.state,
      appSettings: await this.loadAppSettings()
    }

    ipcMain.handle(ElectronIPCChannel.getAppSettings, this.onGetAppSettings)
    ipcMain.handle(ElectronIPCChannel.saveAppSettings, this.onSaveAppSettings)
    ipcMain.on(ElectronIPCChannel.getAppSettingsSync, this.onGetAppSettingsSync)
    ipcMain.on(ElectronIPCChannel.saveAppSettingsSync, this.onSaveAppSettingsSync)

    if (module.hot) {
      module.hot.addDisposeHandler(() => {
        ipcMain.removeHandler(ElectronIPCChannel.getAppSettings)
        ipcMain.removeHandler(ElectronIPCChannel.saveAppSettings)
        ipcMain.off(ElectronIPCChannel.getAppSettingsSync, this.onGetAppSettingsSync)
        ipcMain.off(ElectronIPCChannel.saveAppSettingsSync, this.onSaveAppSettingsSync)
      })
    }
  }

  private async loadAppSettings(): Promise<AppSettings> {
    const settingsFile = AppFiles.appSettingsFile
    try {
      const stats = await Fs.promises.lstat(settingsFile)
      if (!stats.isFile()) {
        throw Error(`${settingsFile} is not a normal file`)
      }
      const jsonStr = await Fs.promises.readFile(settingsFile, "utf-8")
      return AppSettings.fromJsonString(jsonStr)
    } catch (err) {
      warn(`Failed to load app settings, using defaults`, err)
      return AppSettings.create({
        activeDashboardId: null,
        autoconnect: false
      })
      
    }
    
  }

  private saveAppSettings(appSettings: AppSettings): void {
    if (this.saveQueue_.size) {
      this.saveQueue_.clear()
    }
    
    this.saveQueue_.add(async () => {
      const jsonStr = AppSettings.toJsonString(appSettings, {
        enumAsInteger: false,
        emitDefaultValues: true
      })
      
      await Fs.promises.writeFile(AppFiles.appSettingsFile, jsonStr)
      
      return appSettings
    })
  }
  
  constructor() {}
  
  get appSettings() {
    return this.state.appSettings
  }
  
  changeSettings(newSettings: Partial<AppSettings>): AppSettings {
    return this.patchSettings(newSettings)
  }
  
  
}

export default AppSettingsService
