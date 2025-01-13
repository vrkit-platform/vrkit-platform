import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { ipcMain } from "electron"

import {
  AppSettingsDefaults,
  Bind, defaults,
  Disposables,
  ElectronIPCChannel,
  ErrorKind
} from "@vrkit-platform/shared"
import { AppSettings, ThemeType } from "@vrkit-platform/models"
import { AppFiles } from "@vrkit-platform/shared/constants/node"
import Fs from "fs"
import PQueue from "p-queue"
import { IObjectDidChange, runInAction, set } from "mobx"
import SharedAppState from "../store"
import { deepObserve } from "mobx-utils"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


@Singleton()
export class AppSettingsService {
  private readonly disposers_ = new Disposables()
  private readonly saveQueue_ = new PQueue({
    concurrency: 1
  })

  // private state: AppSettingsServiceState = {
  //   appSettings: AppSettings.create()
  // }
  get state() {
    return this.sharedAppState.appSettings
  }

  @Bind
  private patchSettings(settings: Partial<AppSettings>): AppSettings {
    return runInAction(() => {
      set(this.sharedAppState.appSettings, settings)

      return this.sharedAppState.appSettings
    })
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
    return AppSettings.toJson(this.patchSettings(settings), {
      emitDefaultValues: true
    })
  }

  /**
   * Resource cleanup
   */
  [Symbol.dispose]() {
    this.disposers_.dispose()
  }

  /**
   * Simply calls dispose
   * @private
   */
  private unload() {
    this[Symbol.dispose]()
  }
  /**
   * Initialize
   */
  @PostConstruct()
  protected async init() {
    this.sharedAppState.setAppSettings(await this.loadAppSettings())

    this.sharedAppState.setAppSettings(this.sharedAppState.appSettings)

    ipcMain.handle(ElectronIPCChannel.getAppSettings, this.onGetAppSettings)
    ipcMain.handle(ElectronIPCChannel.saveAppSettings, this.onSaveAppSettings)
    ipcMain.on(ElectronIPCChannel.getAppSettingsSync, this.onGetAppSettingsSync)
    ipcMain.on(ElectronIPCChannel.saveAppSettingsSync, this.onSaveAppSettingsSync)

    this.disposers_.push(deepObserve(this.sharedAppState.appSettings, this.onStateChange))
    this.disposers_.push(() => {
      ipcMain.removeHandler(ElectronIPCChannel.getAppSettings)
      ipcMain.removeHandler(ElectronIPCChannel.saveAppSettings)
      ipcMain.off(ElectronIPCChannel.getAppSettingsSync, this.onGetAppSettingsSync)
      ipcMain.off(ElectronIPCChannel.saveAppSettingsSync, this.onSaveAppSettingsSync)
    })
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.unload()
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
      return defaults(AppSettings.fromJsonString(jsonStr, {
        ignoreUnknownFields: true
      }),AppSettingsDefaults)
    } catch (err) {
      warn(`Failed to load app settings, using defaults`, err)
      return AppSettings.create(AppSettingsDefaults)
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
   * @param _change
   */
  @Bind
  private onStateChange(_change: IObjectDidChange<AppSettings>) {
    this.saveAppSettings(this.appSettings)
  }

  /**
   * Constructor for singleton
   *
   * @param sharedAppState
   */
  constructor(readonly sharedAppState: SharedAppState) {}

  get appSettings() {
    return this.sharedAppState.appSettings
  }

  changeSettings(newSettings: Partial<AppSettings>): AppSettings {
    return this.patchSettings(newSettings)
  }
}

export default AppSettingsService
