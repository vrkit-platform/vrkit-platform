import Path from "path"
import { screen } from "electron"
import Fsx from "fs-extra"

import { Bind } from "@vrkit-platform/shared"
import { WindowSizeDefault } from "./WindowConstants"
import { defaults, WindowConfig } from "@vrkit-platform/shared"
import { getLogger } from "@3fv/logger-proxy"

import { Deferred } from "@3fv/deferred"
import { AppPaths } from "@vrkit-platform/shared/constants/node"
import { asOption } from "@3fv/prelude-ts"
import { WindowMainInstance } from "./WindowMainTypes"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export interface WindowStatePersistenceConfig {
  file: string

  path: string

  maximize: boolean

  fullScreen: boolean

  defaultWidth?: number

  defaultHeight?: number
}

export interface WindowStatePersistData {
  x: number

  y: number

  width: number

  height: number

  displayBounds: Electron.Rectangle

  isMaximized: boolean

  isFullScreen: boolean
}

export function getDisplayBounds(win: Electron.BrowserWindow): Electron.Rectangle {
  return screen.getDisplayMatching(win.getBounds()).bounds
}


export class WindowStateManager {
  static readonly EventHandlingDelay = 100

  #state: Partial<WindowStatePersistData> = {}
  
  #enabled: boolean = false
  
  #stateChangeTimer: number
  
  #winInstance: WindowMainInstance
  
  #filename: string
  
  readonly #deferredReady = new Deferred<this>()
  
  
  get winRef(): Electron.BrowserWindow {
    return this.#winInstance?.browserWindow
  }

  readonly config: WindowStatePersistenceConfig

  whenReady() {
    return this.#deferredReady.promise
  }
  
  constructor(
      readonly winId: string,
      readonly winConfig: WindowConfig,
      options: Partial<WindowStatePersistenceConfig> = {}
  ) {
    //const winConfig = winInstance.config
    log.assert(winConfig.manageState, `Window with Role (${winConfig.role}) does not have manageState enabled`)
    
    const
        file = asOption(`window-${winConfig.role}`)
            .mapIf(() => winConfig.multiple, (f: string) => `${f}-${winId}`)
            .map(f => `${f}-state.json`)
            .get()
    
        this.config =
      {
        file,
        path: AppPaths.appDataDir,
        maximize: true,
        fullScreen: true,
        defaultWidth: WindowSizeDefault.width,
        defaultHeight: WindowSizeDefault.height,
        ...options
      }
      
    
    this.#filename = Path.join(this.config.path, this.config.file)
    this.load()
  }

  isNormal(win: Electron.BrowserWindow) {
    return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen()
  }

  hasBounds() {
    const state = this.#state
    return (
      state &&
      Number.isInteger(state.x) &&
      Number.isInteger(state.y) &&
      Number.isInteger(state.width) &&
      state.width > 0 &&
      Number.isInteger(state.height) &&
      state.height > 0
    )
  }

  resetStateToDefault() {
    const displayBounds = screen.getPrimaryDisplay().bounds
    const { config } = this
    // Reset state to default values on the primary display
    this.#state = {
      width: config.defaultWidth || 800,
      height: config.defaultHeight || 600,
      x: 0,
      y: 0,
      displayBounds
    }
  }

  windowWithinBounds(bounds: Electron.Rectangle) {
    // const { #state } = this
    return (
      this.#state.x >= bounds.x &&
      this.#state.y >= bounds.y &&
      this.#state.x <= bounds.x + bounds.width &&
      this.#state.y <= bounds.y + bounds.height
    )
  }

  ensureWindowVisibleOnSomeDisplay() {
    const visible = screen.getAllDisplays().some(display => {
      return this.windowWithinBounds(display.bounds)
    })

    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      this.resetStateToDefault()
    }
  }

  validateState() {
    const isValid = this.#state && (this.hasBounds() || this.#state.isMaximized || this.#state.isFullScreen)

    if (!isValid) {
      this.#state = null
    } else if (this.hasBounds() && this.#state.displayBounds) {
      this.ensureWindowVisibleOnSomeDisplay()
    }
  }

  @Bind updateState(win: Electron.BrowserWindow = null) {
    win = win ?? this.winRef
    if (!win) {
      return
    }

    // const { #state } = this

    // Don't throw an error when window was closed
    try {
      const winBounds = win.getBounds()
      if (this.isNormal(win)) {
        this.#state.x = winBounds.x
        this.#state.y = winBounds.y
        this.#state.width = winBounds.width
        this.#state.height = winBounds.height
      }
      this.#state.isMaximized = win.isMaximized()
      this.#state.isFullScreen = win.isFullScreen()
      this.#state.displayBounds = getDisplayBounds(win)
    } catch (err) {
      error("Failed to update state", err)
    }
  }

  @Bind async saveState(win: Electron.BrowserWindow = null) {
    // Update window state only if it was provided
    win = win ?? this.winRef
    if (win) {
      this.updateState(win)
    }

    // Save state
    try {
      await Fsx.mkdirs(Path.dirname(this.#filename))
      await Fsx.writeJSON(this.#filename, this.#state)
      info("Saved state", this.#state)
    } catch (err) {
      error("Failed to save state", err)
    }
  }

  @Bind stateChangeHandler() {
    // Handles both 'resize' and 'move'
    clearTimeout(this.#stateChangeTimer)
    this.#stateChangeTimer = setTimeout(this.updateState, WindowStateManager.EventHandlingDelay) as any
  }

  @Bind closeHandler() {
    //this.updateState()
    this.saveState()
  }

  @Bind closedHandler() {
    // Unregister listeners and save state
    this.disable()
    //this.saveState()
  }

  enable(winInstance: WindowMainInstance) {
    log.assert(this.#winInstance?.id === winInstance.id || !this.#winInstance, `WindowInstance can only be enabled once with an instance of WindowStateManager`)
    
    const { browserWindow: win } = this.#winInstance = winInstance,
        config = this.config
    
    if (this.#enabled)
      this.disable()

    
    if (config.maximize && this.#state.isMaximized) {
      win.maximize()
    }
    if (config.fullScreen && this.#state.isFullScreen) {
      win.setFullScreen(true)
    }

    
    win.on("resize", this.stateChangeHandler)
    win.on("move", this.stateChangeHandler)
    win.on("close", this.closeHandler)
    win.on("closed", this.closedHandler)
  }

  disable() {
    const { winRef } = this
    if (this.#enabled) {
      winRef.removeListener("resize", this.stateChangeHandler)
      winRef.removeListener("move", this.stateChangeHandler)
      if (this.#stateChangeTimer) {
        clearTimeout(this.#stateChangeTimer)
        this.#stateChangeTimer = null
      }
      winRef.removeListener("close", this.closeHandler)
      winRef.removeListener("closed", this.closedHandler)
      this.#enabled = false
    }
  }

  // Load previous state
  async load() {
    try {
      try {
        if (await Fsx.pathExists(this.#filename)) {
          this.#state = await Fsx.readJSON(this.#filename)
        }
      } catch (err) {
        error("Failed to load state", err)
      }
      
      // Check state validity
      this.validateState()
      
      // Set state fallback values
      this.#state = defaults(this.#state, {
        width: this.config.defaultWidth ?? WindowSizeDefault.width,
        height: this.config.defaultHeight ?? WindowSizeDefault.height
      })
      
      info("Initial state", this.#state)
      this.#deferredReady.resolve(this)
    } catch (err) {
      error(`Unable to initialize & load window state manager`, err)
      if (!this.#deferredReady.isSettled())
        this.#deferredReady.reject(err)
    }
  }

  get x() {
    return this.#state?.x ?? 0
  }

  get y() {
    return this.#state?.y ?? 0
  }

  get width() {
    return this.#state?.width ?? 0
  }

  get height() {
    return this.#state?.height ?? 0
  }

  get displayBounds() {
    return (this.#state?.displayBounds ?? !this.winRef) ? null : getDisplayBounds(this.winRef)
  }

  get isMaximized() {
    return this.#state?.isMaximized
  }

  get isFullScreen() {
    return this.#state?.isFullScreen
  }

  get createWindowOptions() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }
}

export default WindowStateManager
