import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { ipcMain, webContents } from "electron"
import { AppSettings } from "vrkit-app-common/models"
import { asOption } from "@3fv/prelude-ts"
import { cloneDeep, ErrorKind, isEqual } from "vrkit-app-common/utils"
import MainAppState from "../store"
import { IObjectDidChange, observe } from "mobx"
import { Bind } from "vrkit-app-common/decorators"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

interface AppSettingsServiceState {
  appSettings: AppSettings
}

@Singleton()
export class AppSettingsService {
  private readonly state: AppSettingsServiceState

  @Bind
  private onGetAppSettingsSync(event: Electron.IpcMainEvent) {
    event.returnValue = this.mainState.appSettings
  }

  @Bind
  private onSaveAppSettingsSync(
    event: Electron.IpcMainEvent,
    settings: AppSettings
  ) {
    let result: AppSettings | ErrorKind
    try {
      this.mainState.setAppSettings(settings)
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
    return this.mainState.appSettings
  }

  /**
   * Responder
   *
   * @param _event
   * @param settings
   */
  @Bind
  private async onSaveAppSettings(
    _event: Electron.IpcMainInvokeEvent,
    settings: AppSettings
  ) {
    this.mainState.setAppSettings(settings)
  }

  /**
   * On state change, emit to renderers
   *
   * @param change
   */
  @Bind
  private onStateChange(change: IObjectDidChange<MainAppState>) {
    const newSettings = change.object.appSettings
    if (!isEqual(newSettings, this.state.appSettings)) {
      this.state.appSettings = cloneDeep(newSettings)

      webContents.getAllWebContents().forEach(webContent => {
        webContent.send(ElectronIPCChannel.settingsChanged, newSettings)
      })
    }
  }

  /**
   * Initialize
   */
  @PostConstruct()
  private async init() {
    ipcMain.handle(ElectronIPCChannel.getAppSettings, this.onGetAppSettings)
    ipcMain.handle(ElectronIPCChannel.saveAppSettings, this.onSaveAppSettings)
    ipcMain.on(ElectronIPCChannel.getAppSettingsSync, this.onGetAppSettingsSync)
    ipcMain.on(
      ElectronIPCChannel.saveAppSettingsSync,
      this.onSaveAppSettingsSync
    )

    const unsubscribe = observe(this.mainState, this.onStateChange, false)

    if (module.hot) {
      module.hot.addDisposeHandler(() => {
        unsubscribe()
        ipcMain.removeHandler(ElectronIPCChannel.getAppSettings)
        ipcMain.removeHandler(ElectronIPCChannel.saveAppSettings)
        ipcMain.off(
          ElectronIPCChannel.getAppSettingsSync,
          this.onGetAppSettingsSync
        )
        ipcMain.off(
          ElectronIPCChannel.saveAppSettingsSync,
          this.onSaveAppSettingsSync
        )
      })
    }
  }

  constructor(readonly mainState: MainAppState) {
    this.state = {
      appSettings: mainState.appSettings
    }
  }
}

export default AppSettingsService
