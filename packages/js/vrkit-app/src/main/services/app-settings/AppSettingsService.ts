import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { ipcMain } from "electron"

import { ErrorKind } from "vrkit-app-common/utils"
import { Bind } from "vrkit-app-common/decorators"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"
import { AppSettings } from "vrkit-models"
import { AppFiles } from "vrkit-app-common/constants"
import Fs from "fs"
import PQueue from "p-queue"
import { IObjectDidChange, set } from "mobx"
import SharedAppState from "../store"
import { BindAction } from "../../decorators"
import { AppSettingsSchema } from "vrkit-app-common/models"
import { serialize } from "serializr"
import { deepObserve } from "mobx-utils"

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

  // private state: AppSettingsServiceState = {
  //   appSettings: AppSettings.create()
  // }
  get state() {
    return this.sharedAppState.appSettings
  }

  @BindAction()
  private patchSettings(settings: Partial<AppSettings>): AppSettings {
    set(this.sharedAppState.appSettings, settings)

    return this.sharedAppState.appSettings
  }

  @Bind
  private onGetAppSettingsSync(event: Electron.IpcMainEvent) {
    event.returnValue = this.sharedAppState.appSettings
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
    return this.sharedAppState.appSettings
  }

  /**
   * Responder
   *
   * @param _event
   * @param settings
   */
  @Bind
  private async onSaveAppSettings(_event: Electron.IpcMainInvokeEvent, settings: Partial<AppSettings>) {
    return serialize(AppSettingsSchema, this.patchSettings(settings))
  }

  /**
   * On state change, emit to renderers
   *
   */
  @Bind
  private broadcastAppSettingsChange() {
    // const {appSettings} = this
    //
    // webContents.getAllWebContents().forEach(webContent => {
    //   webContent.send(ElectronIPCChannel.settingsChanged, appSettings)
    // })
  }

  /**
   * Initialize
   */
  @PostConstruct()
  private async init() {
    this.sharedAppState.setAppSettings(await this.loadAppSettings())

    this.sharedAppState.setAppSettings(this.sharedAppState.appSettings)

    ipcMain.handle(ElectronIPCChannel.getAppSettings, this.onGetAppSettings)
    ipcMain.handle(ElectronIPCChannel.saveAppSettings, this.onSaveAppSettings)
    ipcMain.on(ElectronIPCChannel.getAppSettingsSync, this.onGetAppSettingsSync)
    ipcMain.on(ElectronIPCChannel.saveAppSettingsSync, this.onSaveAppSettingsSync)

    const unsubscribe = deepObserve(this.sharedAppState.appSettings, this.onStateChange)
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
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
      return AppSettings.fromJsonString(jsonStr, {
        ignoreUnknownFields: true
      })
    } catch (err) {
      warn(`Failed to load app settings, using defaults`, err)
      return AppSettings.create({
        defaultDashboardConfigId: null,
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

  /**
   * On state change, emit to renderers
   *
   * @param change
   */
  @Bind
  private onStateChange(change: IObjectDidChange<AppSettings>) {
    this.saveAppSettings(this.appSettings)
    // const newSettings = change.object.appSettings
    // if (!isEqual(newSettings, this.state.appSettings)) {
    //   this.state.appSettings = cloneDeep(newSettings)
    //
    //   webContents.getAllWebContents().forEach(webContent => {
    //     webContent.send(ElectronIPCChannel.settingsChanged, newSettings)
    //   })
    // }
  }

  constructor(readonly sharedAppState: SharedAppState) {}

  get appSettings() {
    return this.sharedAppState.appSettings
  }

  changeSettings(newSettings: Partial<AppSettings>): AppSettings {
    return this.patchSettings(newSettings)
  }
}

export default AppSettingsService
