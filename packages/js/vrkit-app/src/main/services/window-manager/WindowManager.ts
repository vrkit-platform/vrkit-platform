import { PostConstruct, Singleton } from "@3fv/ditsy"
import Fsx from "fs-extra"
import WindowStateManager from "./WindowStateManager"
import { app, BrowserWindow, ipcMain } from "electron"
import EventEmitter3 from "eventemitter3"
import * as ElectronRemote from "@electron/remote/main"
import {
  assign,
  Bind,
  cloneDeep,
  defaults,
  DesktopWindowTrafficLight,
  Disposables,
  ElectronIPCChannel,
  generateShortId,
  greaterThan,
  invoke,
  invokeProp,
  isNotEmptyString,
  lessThan,
  pairOf,
  propEqualTo,
  removeIfMutation,
  signalFlag
} from "@vrkit-platform/shared"
import { match } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import SharedAppState from "../store"
import { AppSettingsService } from "../app-settings"
import { IValueDidChange, observe } from "mobx"
import { guard, isDefined, isNumber, isPromise, isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import {
  AppBuildPaths,
  BaseWindowConfigs,
  isFloatingWindow, isNormalWindow,
  isWindowRole,
  WindowConfig,
  WindowInstance,
  WindowRole
} from "./WindowTypes"
import Path from "path"
import { createWindowOpenHandler } from "./WindowHelpers"
import { WindowSizeDefault } from "./WindowConstants"
import { Deferred } from "@3fv/deferred"
import { get } from "lodash/fp"
import { isMac } from "../../constants"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export interface MainWindowEventArgs {
  UI_READY: (win: BrowserWindow) => void
}

@Singleton()
export class WindowManager extends EventEmitter3<MainWindowEventArgs> {
  // #windowMap = new Map<number, BrowserWindow>()
  readonly #windows = Array<WindowInstance>()

  readonly #disposers = new Disposables()

  has(id: string) {
    return !!this.get(id)
  }

  get(id: string) {
    const matches = this.#windows.filter(propEqualTo("id", id))
    log.assert(matches.length < 2, `ID (${id}) is not unique, this is fatal`)
    return matches[0]
  }

  getByRole(role: WindowRole) {
    const config = BaseWindowConfigs[role],
      matches = this.#windows.filter(propEqualTo("role", role))

    if (!config.multiple) {
      log.assert(matches.length < 2, `Role ${role} does not support multiple windows`)
    }

    return matches
  }

  getByBrowserWindow(win: BrowserWindow): WindowInstance {
    return this.#windows.find(it => it.browserWindow?.id === win?.id)
  }

  get mainWindowInstance() {
    return this.getByRole(WindowRole.Main)[0]
  }

  get mainWindow() {
    return this.mainWindowInstance?.browserWindow
  }

  get settings() {
    return this.sharedAppState.appSettings
  }

  constructor(
    readonly sharedAppState: SharedAppState,
    readonly appSettingsManager: AppSettingsService
  ) {
    super()
    
    app.on("window-all-closed", () => {
      if (!isMac) {
        app.quit()
      }
    })
  }

  [Symbol.dispose]() {
    this.#disposers.dispose()

    Object.assign(global, {
      windowManager: null
    })
    
    this.close(...this.#windows)
  }

  @Bind
  private unload() {
    this[Symbol.dispose]()
  }

  @PostConstruct() // @ts-ignore
  private async init(): Promise<void> {
    if (isDev) {
      Object.assign(global, {
        windowManager: this
      })
    }
    
    
    // PREPARE ALTERNATIVE
    // app.on("browser-window-created", (_, newWin) => {
    //   prepareWindow(getSharedAppStateStore(), newWin)
    // })

    ipcMain.on(ElectronIPCChannel.trafficLightTrigger, this.handleTrafficLightTrigger)
    this.#disposers.push(() => {
      ipcMain.off(ElectronIPCChannel.trafficLightTrigger, this.handleTrafficLightTrigger)
    })
    this.#disposers.push(observe(this.sharedAppState.appSettings, "zoomFactor", this.onZoomChanged))

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.unload()
      })
    }
  }
  
  /**
   * Traffic light handler
   *
   * @param ev
   * @param trafficLight
   * @private
   */
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
    for (const wi of this.#windows) {
      const { browserWindow, role } = wi
      if (!browserWindow || !isNormalWindow(wi)) {
        log.warn(`Window (${wi.id}) of type (${wi.type}) is either not "Normal" or does not have a browserWindow set, can not adjust zoom`)
        continue
      }
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
        pairOf([this.mainWindow?.webContents?.devToolsWebContents], zoomFactor) // + 0.25
      ).forEach(([wcs, zf]) => wcs.filter(isDefined<Electron.WebContents>).forEach(invokeProp("setZoomFactor", zf)))
    }
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

  /**
   * Close window & remove it from list of managed
   *
   * @param winOrIds
   */
  close(...winOrIds: Array<string | WindowInstance>) {
    const wis = winOrIds.map(it => (isString(it) ? this.get(it) : it))
            .filter(it => !!it && !it.browserWindowClosed),
      winIds = wis.map(get("id"))
    
    if (!winIds.length)
      return

    for (const wi of wis) {
      if (wi.browserWindowClosed)
        continue
      
      wi.browserWindowClosed = true
      const bw = wi?.browserWindow

      if (bw && bw.isClosable()) {
        guard(
          () => bw.close(),
          err => log.warn(`Unable to cleanly close browser window ${wi.id}`, err)
        )
      }
    }

    removeIfMutation(this.#windows, ({ id }) => winIds.includes(id))
  }

  async create<Config extends WindowConfig>(config: WindowConfig): Promise<WindowInstance<Config>>
  async create<Role extends WindowRole>(role: Role, config?: Partial<WindowConfig<Role>>): Promise<WindowInstance<any>>
  async create(
    configOrRole: WindowConfig | WindowRole,
    configOpt: Partial<WindowConfig> = {}
  ): Promise<WindowInstance<WindowConfig<any>>> {
    const winInstance = {} as WindowInstance,
      config: WindowConfig = assign(cloneDeep(
        isWindowRole(configOrRole) ? BaseWindowConfigs[configOrRole] : configOrRole),
        configOpt
      ),
      role = config.role,
      winId = isNotEmptyString(config.id)
        ? config.id
        : config.multiple
          ? `${config.role}-${generateShortId()}`
          : config.role
    
    
    log.assert(!this.has(winId),`A window with ID=${winId} already exists`)
    
    try {
      // UPDATE IDs
      winInstance.id = config.id = winId

      // WINDOW STATE MANAGER (WSM)
      const wsm = config.manageState ? new WindowStateManager(winId, config) : null,
        wsmWinOpts = wsm ? defaults(await wsm.whenReady().then(get("createWindowOptions")), WindowSizeDefault) : {}

      const bwOpts: Electron.BrowserWindowConstructorOptions = {
          ...config.browserWindowOptions,
          ...wsmWinOpts
        },
        bw = new BrowserWindow(bwOpts)

      assign(winInstance, {
        type: config.type,
        role,
        config,
        stateManager: wsm,
        browserWindow: bw,
        browserWindowClosed: false,
        browserWindowOptions: bwOpts,
        onBrowserWindowCreated: config.onBrowserWindowCreated,
        onBrowserWindowReady: config.onBrowserWindowReady
      })
      
      
      log.assert(
          !this.has(winId),
          `new window id (${winId}) is not unique and multiple windows with role (${role}) is not allowed`
      )
      this.#windows.push(winInstance)

      // INVOKING CREATED CALLBACK
      const onCreatedRes = asOption(winInstance.onBrowserWindowCreated).map(invoke(bw, winInstance)).getOrNull()

      if (isPromise(onCreatedRes)) {
        log.info(`Waiting for onCreatedRes promise to resolve`)
        await onCreatedRes
      }

      // PREPARE THE WINDOW
      log.info(`Preparing window (${winId})`)
      this.prepareBrowserWindow(bw)

      // ENABLE WINDOW STATE MANAGER
      wsm.enable(winInstance)


      const firstLoadSignal = signalFlag()
      bw.on("ready-to-show", () => {
        if (firstLoadSignal.set()) {
          log.warn(`Already called ready-to-show`)
          return
        }

        log.assert(!!bw, '"bw" is not defined')

        // SHOW MAIN WINDOW
        log.debug(`window (${winId}) is ready to show`)
        bw.show()
        this.emit("UI_READY", bw)
      })

      bw.on("closed", () => {
        if (role === WindowRole.Main) {
          log.info(`Main window closed, exiting app`)
          app.quit()
          app.exit(0)

          Deferred.delay(200).then(() => {
            const pid = process.pid
            console.info(`Exiting process`)

            process.kill(pid)
            process.exit(0)
          })
        }
      })

      log.info(`Loading url (${config.url}) for window (${winId})`)
      await bw.loadURL(config.url).catch(err => log.error("Failed to load url", config.url, err))

      // INVOKING READY CALLBACK
      const onReadyRes = asOption(winInstance.onBrowserWindowReady).map(invoke(bw, winInstance)).getOrNull()

      if (isPromise(onReadyRes)) {
        log.info(`Waiting for onReadyRes promise to resolve`)
        await onReadyRes
      }

      return winInstance
    } catch (err) {
      log.error(`createWindow(id=${winInstance.id}) failed`, err)
      this.close(winInstance)
      // if (winInstance.browserWindow) {
      //   winInstance.browserWindow.close()
      // }

      throw err
    }
  }

  /**
   * Prepare window & attach event handlers, etc
   *
   * @param win
   */
  @Bind
  private prepareBrowserWindow(win: BrowserWindow) {
    const wi = this.getByBrowserWindow(win)

    //const { id } = win

    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      callback({ requestHeaders: { Origin: "*", ...details.requestHeaders } })
    })
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
          ]
        }
      })
    })

    // CREATE A HANDLER FOR WINDOW OPEN REQUESTS
    const windowOpenHandler = createWindowOpenHandler((ev, result) => {
      log.info(`windowOpenHandler`, ev)
      return result
    })

    // ENABLE ACCESS TO ALL ELECTRON RENDERER MODULES
    ElectronRemote.enable(win.webContents)

    // ATTACH WINDOW EVENT HANDLERS
    win
      .on("close", () => {
        if (!wi.browserWindowClosed)
          this.close(wi.id)
      })
      .on("show", () => {
        win.webContents.setWindowOpenHandler(windowOpenHandler)
        if (this.sharedAppState.devSettings.alwaysOpenDevTools) {
          if (isFloatingWindow(wi)) {
            win.webContents.openDevTools()
          } else {
            win.webContents.openDevTools({
              mode: "detach"
            })
          }
        }
      })

    // ATTACH WEB CONTENT HANDLERS
    win.webContents
      .on("render-process-gone", (event, details) => {
        error(`Renderer process crashed`, details, event)
      })
      // .on("did-create-window", (newWin, details) => {
      //   info(`Preparing new webContents window`)
      //   this.prepareWindow(newWin)
      // })
      .on("devtools-opened", () => {
        asOption(AppBuildPaths.root)
          .filter(Fsx.existsSync)
          .ifSome(rootDir => {
            win.webContents.addWorkSpace(Path.resolve(rootDir))
            this.sharedAppState.devSettings.workspaceSourcePaths
              .filter(dir => Fsx.pathExistsSync(dir))
              .forEach(dir => win.webContents.addWorkSpace(dir))
          })
      })
      .on("devtools-opened", () => {
        this.updateZoom()
      })
      .setWindowOpenHandler(windowOpenHandler)

    this.updateZoom()
  }
}
