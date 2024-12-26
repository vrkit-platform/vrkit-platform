import { PostConstruct, Singleton } from "@3fv/ditsy"
import WindowManager from "./WindowManagerService"
import { app, BrowserWindow, ipcMain } from "electron"
import EventEmitter3 from "eventemitter3"
import {
  Bind,
  DesktopWindowTrafficLight,
  ElectronIPCChannel,
  greaterThan,
  invokeProp,
  lessThan,
  pairOf
} from "@vrkit-platform/shared"
import { match } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import SharedAppState from "../store"
import { AppSettingsService } from "../app-settings"
import { IValueDidChange, observe } from "mobx"
import { isDefined, isNumber } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)

export interface MainWindowEventArgs {
  UI_READY: (win: BrowserWindow) => void
}

@Singleton()
export class MainWindowManager extends EventEmitter3<MainWindowEventArgs> {
  private mainWindow_: Electron.BrowserWindow = null

  get settings() {
    return this.sharedAppState.appSettings
  }

  get mainWindow() {
    return this.mainWindow_
  }

  constructor(
    readonly sharedAppState: SharedAppState,
    readonly appSettingsManager: AppSettingsService,
    readonly windowManager: WindowManager
  ) {
    super()
  }

  private unload() {
    ipcMain.off(ElectronIPCChannel.trafficLightTrigger, this.handleTrafficLightTrigger)
    Object.assign(global, {
      mainWindowManager: null
    })
  }

  @Bind
  private handleTrafficLightTrigger(ev: Electron.IpcMainEvent, trafficLight: DesktopWindowTrafficLight) {
    const win = BrowserWindow.fromWebContents(ev.sender)
    log.info(`Traffic light pressed (${trafficLight})`)
    match(trafficLight)
      .with(DesktopWindowTrafficLight.close, () => app.quit())
      .with(DesktopWindowTrafficLight.minimize, () => win.minimize())
      .with(DesktopWindowTrafficLight.maximize, () => (win.isMaximized() ? win.restore() : win.maximize()))
      .run()
  }

  /**
   * Update the zoom factor for managed window(s) &
   * DevTools if they exist
   *
   * @private
   */
  private updateZoom() {
    const zoomFactor = asOption(this.settings.zoomFactor)
      .filter(isNumber)
      .filter(greaterThan(0))
      .filter(lessThan(3))
      .getOrCall(
        () =>
          this.appSettingsManager.changeSettings({
            zoomFactor: 1.0
          }).zoomFactor
      )
    Array<[Electron.WebContents[], number]>(
      pairOf([this.mainWindow?.webContents], zoomFactor),
      pairOf([this.mainWindow?.webContents?.devToolsWebContents], zoomFactor + 0.25)
    ).forEach(([wcs, zf]) => wcs.filter(isDefined<Electron.WebContents>).forEach(invokeProp("setZoomFactor", zf)))
  }

  /**
   * on zoom changed observation, update the zoom
   *
   * @param _change
   * @private
   */
  @Bind
  private onZoomChanged(_change: IValueDidChange<number>) {
    this.updateZoom()
  }

  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    if (isDev) {
      Object.assign(global, {
        mainWindowManager: this
      })
    }

    ipcMain.on(ElectronIPCChannel.trafficLightTrigger, this.handleTrafficLightTrigger)
    observe(this.sharedAppState.appSettings, "zoomFactor", this.onZoomChanged)

    if (import.meta.webpackHot) {
      const previousMainWindow = import.meta.webpackHot.data?.["mainWindow"]
      if (previousMainWindow) {
        this.setMainWindow(previousMainWindow)
      }

      import.meta.webpackHot.dispose(data => {
        data["mainWindow"] = this.mainWindow_
      })
    }
  }

  /**
   * Set the current main window
   *
   * @param newMainWindow
   */
  setMainWindow(newMainWindow: Electron.BrowserWindow = null) {
    if (this.mainWindow_ === newMainWindow) {
      return
    }
    if (this.mainWindow_) {
      this.mainWindow_.close()
    }

    this.mainWindow_ = newMainWindow
    this.windowManager.enable(newMainWindow)
    this.mainWindow_?.webContents?.on?.("devtools-opened", () => {
      this.updateZoom()
    })
    
    this.updateZoom()
  }
}
