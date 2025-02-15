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
  isNotEmptyString,
  isWindowRole,
  lessThan,
  Noop,
  pairOf,
  propEqualTo,
  removeIfMutation,
  signalFlag,
  type WindowConfig,
  type WindowCreateOptions,
  type WindowMetadata,
  WindowRole
} from "@vrkit-platform/shared"
import { match, P } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import SharedAppState from "../store"
import { AppSettingsService } from "../app-settings"
import { IValueDidChange, observe, runInAction, set } from "mobx"
import { guard, isArray, isDefined, isNumber, isPromise, isString } from "@3fv/guard"
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
import { get } from "lodash/fp"
import { isMac } from "../../constants"
import { first, omit, pick } from "lodash"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export interface MainWindowEventArgs {
  MAIN_WINDOW_READY: (windowInstance: WindowMainInstance) => void
}

@Singleton()
export class WindowManager extends EventEmitter3<MainWindowEventArgs> {
  readonly #windows = Array<WindowMainInstance>()

  readonly #disposers = new Disposables()

  #updateDesktopWindowsState() {
    runInAction(() => {
      const windowsMetadata = this.#windows
        .map(get("config"))
        .map(it => omit(it, ["onBrowserWindowEvent", "browserWindowOptions"]) as WindowMetadata)
        .reduce(
          (map, md) => ({
            ...map,
            [md.id]: md
          }),
          {} as Record<string, WindowMetadata>
        )
      set(this.sharedAppState.desktopWindows, "windows", windowsMetadata)
    })
  }

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

  /**
   * Broadcast an event to the main window
   *
   * @param ipcEventName
   * @param args
   * @private
   */
  sendToMainWindow<T extends string, Args extends any[]>(ipcEventName: T, ...args: Args): void {
    this.mainWindow?.webContents?.send(ipcEventName, ...args)
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
    ev.returnValue = omit(
      wi.config,
      "onBrowserWindowEvent",
      "onBrowserWindowCreated",
      "onBrowserWindowReady",
      "browserWindowOptions"
    )
  }

  /**
   * Request a window close (normally called from a traffic light press, etc)
   *
   * @param win
   */
  closeRequest(win: Electron.BrowserWindow = BrowserWindow.getFocusedWindow()) {
    const wi = this.getByBrowserWindow(win)
    if (!wi) {
      if (win) {
        log.warn(`Unknown browser window instance (${win.id}), closing explicitly`)
        guard(() => win.close())
      }
      return
    }
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
        if (log.isDebugEnabled()) {
          log.debug(
            `Window (${wi.id}) of type (${wi.type}) is either not "Normal" or does not have a browserWindow set, can not adjust zoom`
          )
        }
        continue
      }
      const zoomFactor = asOption(this.settings.zoomFactor)
        .filter(isNumber)
        .filter(greaterThan(0))
        .filter(lessThan(3))
        .getOrCall(() =>
          runInAction(
            () =>
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
    const wis = winOrIds.map(it => (isString(it) ? this.get(it) : it)).filter(it => !!it && !it.browserWindowClosed),
      winIds = wis.map(get("id"))

    if (!winIds.length) {
      return
    }

    for (const wi of wis) {
      if (wi.browserWindowClosed) {
        continue
      }

      wi.browserWindowClosed = true

      // HANDLE ROLE SPECIFIC CLOSE BEHAVIOR
      // TODO: Generify this
      match([isDev, wi.role])
        .with([P._, WindowRole.DashboardController], () => {
          runInAction(() => {
            set(this.sharedAppState.dashboards, "activeConfigId", "")
          })
        })
        .otherwise(Noop)

      const bw = wi?.browserWindow

      if (bw && bw.isClosable()) {
        guard(
          () => bw.close(),
          err => log.warn(`Unable to cleanly close browser window ${wi.id}`, err)
        )
      }
    }

    removeIfMutation(this.#windows, ({ id }) => winIds.includes(id))
    this.#updateDesktopWindowsState()
  }

  /**
   * Creates a new window instance with the specified options.
   *
   * @param {Options} options - An object containing configuration options for
   *     the window creation.
   * @returns {Promise<WindowMainInstance>} A promise that resolves to the
   *     created window instance.
   */
  async create<Options extends WindowCreateOptions>(options: Options): Promise<WindowMainInstance>

  /**
   * Creates a new window of the specified role with optional extended options.
   *
   * @param {Role} role - The role of the window to create. It determines the
   *     type of window being instantiated.
   * @param {Partial<WindowCreateOptions>} [optionsExt] - An optional parameter
   *     containing additional window configuration options.
   * @return {Promise<WindowMainInstance>} A promise that resolves to an
   *     instance of the created window.
   */
  async create<Role extends WindowRole>(
    role: Role,
    optionsExt?: Partial<WindowCreateOptions>
  ): Promise<WindowMainInstance>

  /**
   * Creates a new window instance with the specified configuration options or
   * role.
   *
   * @param {WindowCreateOptions|WindowRole} optionsOrRole Configuration
   *     options for the window or predefined window role.
   * @param {Partial<WindowCreateOptions>} [optionsExt={}] Additional
   *     configuration options to extend or override the base options.
   * @return {Promise<WindowMainInstance>} A promise that resolves to the
   *     created window instance (WindowMainInstance).
   */
  async create(
    optionsOrRole: WindowCreateOptions | WindowRole,
    optionsExt: Partial<WindowCreateOptions> = {}
  ): Promise<WindowMainInstance> {
    const config = assign(
        cloneDeep(isWindowRole(optionsOrRole) ? BaseWindowConfigs[optionsOrRole] : optionsOrRole),
        optionsExt
      ) as WindowConfig,
      { role, modal, parentRole } = config

    // IF THIS IS A MODAL WINDOW, FIND THE CORRECT PARENT
    const parentWinInstance: WindowMainInstance = match([modal, parentRole])
      .with([true, P.string], ([, role]) =>
        asOption(this.getByRole(role))
          .filter(isArray)
          .map(first)
          .getOrThrow(`Unable to find a working parent for modal with role (${role})`)
      )
      // .with([true, P._], () =>
      //   asOption(this.mainWindowInstance).getOrThrow(`Unable to find a working parent for modal`)
      // )
      .otherwise(() => null)

    log.assert(!modal || (modal && !!parentWinInstance), `Modal window config, but main window is not available`)

    const winId = isNotEmptyString(config.id)
        ? config.id
        : config.multiple
          ? `${config.role}-${generateShortId()}`
          : config.role,
      winInstance = {
        id: winId,
        modal
      } as WindowMainInstance

    log.assert(!this.has(winId), `A window with ID=${winId} already exists`)

    try {
      // UPDATE IDs
      winInstance.id = config.id = winId

      // WINDOW STATE MANAGER (WSM)
      const wsm = config.manageState ? new WindowStateManager(winId, config) : null,
        wsmWinOpts = wsm ? defaults(await wsm.whenReady().then(get("createWindowOptions")), WindowSizeDefault) : {},
        parentSize = parentWinInstance?.browserWindow?.getSize?.() ?? [],
        parentPos = parentWinInstance?.browserWindow?.getPosition?.() ?? [],
        size = pick(config.browserWindowOptions, ["width", "height"]),
        isOffscreen = config?.browserWindowOptions?.webPreferences?.offscreen ?? false,
        bwOpts: Electron.BrowserWindowConstructorOptions = {
          ...config.browserWindowOptions,
          ...wsmWinOpts,
          ...(modal && {
            modal,
            parent: parentWinInstance?.browserWindow,
            x: parentPos[0] + parentSize[0] / 2 - size.width / 2,
            y: parentPos[1] + parentSize[1] / 2 - size.height / 2
          }),
          show: !isOffscreen
        },
        bw = assign(winInstance, {
          type: config.type,
          role,
          config,
          isOffscreen,
          stateManager: wsm,
          browserWindow: new BrowserWindow(bwOpts),
          browserWindowClosed: false,
          browserWindowOptions: bwOpts,
          onBrowserWindowEvent: config.onBrowserWindowEvent
        }).browserWindow

      log.assert(
        !this.has(winId),
        `new window id (${winId}) is not unique and multiple windows with role (${role}) is not allowed`
      )
      this.#windows.push(winInstance as WindowMainInstance)

      // INVOKING CREATED CALLBACK
      const onCreatedRes = asOption(winInstance.onBrowserWindowEvent)
        .map(invoke("Created", bw, winInstance))
        .getOrNull()

      if (isPromise(onCreatedRes)) {
        log.info(`Waiting for onCreatedRes promise to resolve`)
        await onCreatedRes
      }

      // PREPARE THE WINDOW
      log.info(`Preparing window (${winId})`)
      this.prepareBrowserWindow(winId, winInstance, bw)

      // ENABLE WINDOW STATE MANAGER
      if (wsm) {
        wsm.enable(winInstance as WindowMainInstance)
      }

      log.info(`Loading url (${config.url}) for window (${winId})`)
      await bw.loadURL(config.url).catch(err => log.error("Failed to load url", config.url, err))

      // INVOKING READY CALLBACK
      const onReadyRes = asOption(winInstance.onBrowserWindowEvent)
        .map(invoke("Ready", bw, winInstance))
        .getOrNull()

      if (isPromise(onReadyRes)) {
        log.info(`Waiting for onReadyRes promise to resolve`)
        await onReadyRes
      }

      return winInstance as WindowMainInstance
    } catch (err) {
      log.error(`createWindow(id=${winInstance.id}) failed`, err)
      this.close(winInstance as WindowMainInstance)

      throw err
    } finally {
      this.#updateDesktopWindowsState()
    }
  }

  /**
   * Prepare window & attach event handlers, etc
   *
   * @param winId
   * @param winInstance
   * @param win
   */
  @Bind
  private prepareBrowserWindow(winId: string, winInstance: WindowMainInstance, win: BrowserWindow) {
    const wi = winInstance //this.getByBrowserWindow(win)

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
    const firstLoadSignal = signalFlag()
    win
      .on("ready-to-show", () => {
        if (firstLoadSignal.set()) {
          log.warn(`Already called ready-to-show`)
          return
        }

        log.assert(!!win, '"win" is not defined')

        // SHOW MAIN WINDOW
        log.debug(`window (${winId}) is ready to show`)

        if (!wi.isOffscreen) {
          win.show()
        }
        
        if (wi.role === WindowRole.Main)
          this.emit("MAIN_WINDOW_READY", wi)
      })
      .on("close", () => {
        if (wi.browserWindowClosed) {
          return
        }

        this.close(wi.id)
      })
      .on("closed", () => {
        match([isDev, wi.role])
          .with([false, WindowRole.Main], () => {
            ShutdownManager.shutdown()
          })
          .otherwise(Noop)
      })
      .on("show", () => {
        win.webContents.setWindowOpenHandler(windowOpenHandler)
        if (this.sharedAppState.devSettings.alwaysOpenDevTools) {
          const devToolsTitle = asOption(wi.config.initialRoute).filter(isNotEmptyString).getOrElse(wi.id)
          if (isFloatingWindow(wi) || wi.config.devToolMode) {
            win.webContents.openDevTools({
              mode: wi.config.devToolMode ?? "detach",
              activate: false,
              title: devToolsTitle
            })
          } else {
            win.webContents.openDevTools()
            win.webContents.setDevToolsTitle(devToolsTitle)
          }
        }
      })

    // ATTACH WEB CONTENT HANDLERS
    win.webContents
      .on("render-process-gone", (event, details) => {
        error(`Renderer process crashed`, details, event)
      })
      .on("devtools-opened", () => {
        asOption(AppBuildPaths.root)
          .filter(Fsx.existsSync)
          .ifSome(rootDir => {
            win.webContents.addWorkSpace(Path.resolve(rootDir))
            this.sharedAppState.devSettings.workspaceSourcePaths
              .filter(dir => Fsx.pathExistsSync(dir))
              .forEach(dir => win.webContents.addWorkSpace(dir))
          })
        this.updateZoom()
      })
      .setWindowOpenHandler(windowOpenHandler)

    this.updateZoom()
  }
}
