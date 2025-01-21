import { PostConstruct, Singleton } from "@3fv/ditsy"
import Fsx from "fs-extra"
import WindowStateManager from "./WindowStateManager"
import { app, BrowserWindow, ipcMain, WebContents } from "electron"
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
  isNotEmptyString, isWindowRole,
  lessThan,
  pairOf,
  propEqualTo,
  removeIfMutation,
  signalFlag,
  WindowConfig,
  WindowCreateOptions,
  WindowCreateOptionsRole,
  WindowInstance,
  WindowRole
} from "@vrkit-platform/shared"
import { match } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import SharedAppState from "../store"
import { AppSettingsService } from "../app-settings"
import { IValueDidChange, observe, runInAction } from "mobx"
import { guard, isDefined, isNumber, isPromise, isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import {
  AppBuildPaths,
  BaseWindowConfigs,
  isFloatingWindow,
  isNormalWindow,
  WindowMainInstance
} from "./WindowMainTypes"
import Path from "path"
import { createWindowOpenHandler } from "./WindowHelpers"
import { WindowSizeDefault } from "./WindowConstants"
import { Deferred } from "@3fv/deferred"
import { get } from "lodash/fp"
import { isMac } from "../../constants"
import { omit, pick } from "lodash"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export interface MainWindowEventArgs {
  UI_READY: (win: BrowserWindow) => void
}

@Singleton()
export class WindowManager extends EventEmitter3<MainWindowEventArgs> {
  
  readonly #windows = Array<WindowMainInstance>()

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
  
  getByWebContents(webContents: WebContents): WindowMainInstance {
    return this.#windows.find(it => Object.is(it.browserWindow?.webContents, webContents))
  }
  
  getByBrowserWindow(win: BrowserWindow): WindowMainInstance {
    return this.#windows.find(it => Object.is(it.browserWindow, win))
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
  
  /**
   * Dispose symbol implementation
   */
  [Symbol.dispose]() {
    this.#disposers.dispose()

    Object.assign(global, {
      windowManager: null
    })
    
    this.close(...this.#windows)
  }

  @Bind
  protected unload() {
    this[Symbol.dispose]()
  }

  @PostConstruct() // @ts-ignore
  protected async init(): Promise<void> {
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
    ipcMain.on(ElectronIPCChannel.getWindowConfig, this.handleGetWindowConfig)
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
   *
   /**
   * Handles the retrieval of a window configuration for a given
   * Electron `IpcMainEvent`. The configuration is returned by
   * omitting specific properties that are not required in the response,
   * namely `onBrowserWindowCreated`, `onBrowserWindowReady`, and
   * `browserWindowOptions`.
   *
   * - Retrieves the `WindowMainInstance` based on the `webContents` of the
   * sender.
   * - Ensures that the sender is valid and exists within the `#windows` list.
   * - Asserts if no valid window instance is found for the sender.
   *
   * @param ev The IPC event emitted by Electron's `ipcMain`.
   *           This contains the `webContents` of the sender.
   *
   * @private
   */
  @Bind
  private handleGetWindowConfig(ev: Electron.IpcMainEvent) {
    const wi = this.getByWebContents(ev.sender)
    log.assertFatal(!!wi, "The event sender (webContents) was not found in the #windows list")
    ev.returnValue = omit(wi.config,"onBrowserWindowCreated", "onBrowserWindowReady", "browserWindowOptions")
  }
  
  /**
   * Request a window close (normally called from a traffic light press, etc)
   *
   * @param win
   */
  closeRequest(win: Electron.BrowserWindow = BrowserWindow.getFocusedWindow()) {
    const wi = this.getByBrowserWindow(win)
    this.close(wi)
    match(wi.role)
      .with(WindowRole.Main, () => {
        ShutdownManager.shutdown()
      })
      .otherwise(role => {
        log.debug(`No special action taken for Window closing with role (${role})`)
      })
    
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
    const wi = this.getByWebContents(ev.sender)
    log.assert(!!wi, `Unable to find window instance for webContents`)
    const win = wi.browserWindow
    log.info(`Traffic light pressed (${trafficLight})`)
    match(trafficLight)
      .with(DesktopWindowTrafficLight.close, () => this.closeRequest(win))
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
        if (log.isDebugEnabled())
          log.debug(`Window (${wi.id}) of type (${wi.type}) is either not "Normal" or does not have a browserWindow set, can not adjust zoom`)
        continue
      }
      const zoomFactor = asOption(this.settings.zoomFactor)
        .filter(isNumber)
        .filter(greaterThan(0))
        .filter(lessThan(3))
        .getOrCall(
          () => runInAction(() =>
            this.appSettingsManager.changeSettings({
              zoomFactor: 1.0
            }).zoomFactor
          )
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
  close(...winOrIds: Array<string | WindowMainInstance>) {
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

  async create<Options extends WindowCreateOptions>(options: Options): Promise<WindowMainInstance>
  async create<Role extends WindowRole>(role: Role, optionsExt?: Partial<WindowCreateOptions>): Promise<WindowMainInstance>
  async create(
    optionsOrRole: WindowCreateOptions | WindowRole,
    optionsExt: Partial<WindowCreateOptions> = {}
  ): Promise<WindowMainInstance> {
    const
      config = assign(cloneDeep(
        isWindowRole(optionsOrRole) ? BaseWindowConfigs[optionsOrRole] : optionsOrRole),
        optionsExt
      ) as WindowConfig,
      role = config.role,
      modal = config.modal,
      parentWinInstance = modal ? this.mainWindowInstance : undefined
    
    log.assert(!modal || (modal && !!parentWinInstance),`Modal window config, but main window is not available`)
    
    const
      winId = isNotEmptyString(config.id)
        ? config.id
        : config.multiple
          ? `${config.role}-${generateShortId()}`
          : config.role,
        winInstance = {
          id: winId,
          modal
        } as WindowMainInstance
    
    
    log.assert(!this.has(winId),`A window with ID=${winId} already exists`)
    
    try {
      // UPDATE IDs
      winInstance.id = config.id = winId

      // WINDOW STATE MANAGER (WSM)
      const wsm = config.manageState ? new WindowStateManager(winId, config) : null,
        wsmWinOpts = wsm ? defaults(await wsm.whenReady().then(get("createWindowOptions")), WindowSizeDefault) : {},
        parentSize = parentWinInstance?.browserWindow?.getSize?.() ?? [],
        parentPos = parentWinInstance?.browserWindow?.getPosition?.() ?? [],
        size = pick(config.browserWindowOptions, ["width", "height"]),
        bwOpts: Electron.BrowserWindowConstructorOptions = {
            ...config.browserWindowOptions,
            ...wsmWinOpts,
            ...(modal && {
              modal,
              parent: parentWinInstance.browserWindow,
              x: (parentPos[0] + (parentSize[0] / 2) - (size.width / 2)),
              y: (parentPos[1] + (parentSize[1] / 2) - (size.height / 2))
            })
          },
          bw = assign(winInstance, {
          type: config.type,
          role,
          config,
          stateManager: wsm,
          browserWindow: new BrowserWindow(bwOpts),
          browserWindowClosed: false,
          browserWindowOptions: bwOpts,
          onBrowserWindowEvent: config.onBrowserWindowEvent
        }).browserWindow,
          isOffscreen = bwOpts?.webPreferences?.offscreen ?? false
      
      
      log.assert(
          !this.has(winId),
          `new window id (${winId}) is not unique and multiple windows with role (${role}) is not allowed`
      )
      this.#windows.push(winInstance as WindowMainInstance)

      // INVOKING CREATED CALLBACK
      const onCreatedRes = asOption(winInstance.onBrowserWindowEvent).map(invoke("Created", bw, winInstance)).getOrNull()

      if (isPromise(onCreatedRes)) {
        log.info(`Waiting for onCreatedRes promise to resolve`)
        await onCreatedRes
      }

      // PREPARE THE WINDOW
      log.info(`Preparing window (${winId})`)
      this.prepareBrowserWindow(bw)

      // ENABLE WINDOW STATE MANAGER
      if (wsm)
        wsm.enable(winInstance as WindowMainInstance)


      const firstLoadSignal = signalFlag()
      bw.on("ready-to-show", () => {
        if (firstLoadSignal.set()) {
          log.warn(`Already called ready-to-show`)
          return
        }

        log.assert(!!bw, '"bw" is not defined')

        // SHOW MAIN WINDOW
        log.debug(`window (${winId}) is ready to show`)
        
        if (!isOffscreen)
          bw.show()
        this.emit("UI_READY", bw)
      })

      bw.on("closed", () => {
        if (!isDev && role === WindowRole.Main) {
          ShutdownManager.shutdown()
        }
      })

      log.info(`Loading url (${config.url}) for window (${winId})`)
      await bw.loadURL(config.url).catch(err => log.error("Failed to load url", config.url, err))

      // INVOKING READY CALLBACK
      const onReadyRes = asOption(winInstance.onBrowserWindowEvent).map(invoke("Ready", bw, winInstance)).getOrNull()

      if (isPromise(onReadyRes)) {
        log.info(`Waiting for onReadyRes promise to resolve`)
        await onReadyRes
      }

      return winInstance as WindowMainInstance
    } catch (err) {
      log.error(`createWindow(id=${winInstance.id}) failed`, err)
      this.close(winInstance as WindowMainInstance)
      
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
          if (isFloatingWindow(wi) || wi.config.devToolMode) {
            win.webContents.openDevTools({
              mode: wi.config.devToolMode ?? "detach",
              activate: false
            })
          } else {
            win.webContents.openDevTools()
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
