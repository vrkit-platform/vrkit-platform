import Path from "path"
import { app, screen } from "electron"
import { mkdir } from "shelljs"
import Fs from "fs-extra"

import { Bind } from "@vrkit-platform/shared"
import { WindowSizeDefault } from "../../constants"
import { defaults } from "@vrkit-platform/shared"
import { getLogger } from "@3fv/logger-proxy"
import { Singleton } from "@3fv/ditsy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export interface PersistentWindowConfig {
  file: string

  path: string

  maximize: boolean

  fullScreen: boolean

  defaultWidth?: number

  defaultHeight?: number
}

export interface PersistentWindowState {
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

@Singleton()
export class WindowManager {
  static readonly EventHandlingDelay = 100

  state: Partial<PersistentWindowState> = {}

  winRef: Electron.BrowserWindow = null

  stateChangeTimer: number

  filename: string

  readonly config: PersistentWindowConfig

  constructor() {
    const options: Partial<PersistentWindowConfig> = {}
    const config = (this.config = Object.assign(
      {
        file: "window-state.json",
        path: app.getPath("userData"),
        maximize: true,
        fullScreen: true,
        defaultWidth: WindowSizeDefault.width,
        defaultHeight: WindowSizeDefault.height
      },
      options
    ))
    this.filename = Path.join(config.path, config.file)
    this.load()
  }

  isNormal(win: Electron.BrowserWindow) {
    return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen()
  }

  hasBounds() {
    const { state } = this
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
    this.state = {
      width: config.defaultWidth || 800,
      height: config.defaultHeight || 600,
      x: 0,
      y: 0,
      displayBounds
    }
  }

  windowWithinBounds(bounds: Electron.Rectangle) {
    const { state } = this
    return (
      state.x >= bounds.x &&
      state.y >= bounds.y &&
      state.x <= bounds.x + bounds.width &&
      state.y <= bounds.y + bounds.height
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
    const { state } = this
    const isValid = state && (this.hasBounds() || state.isMaximized || state.isFullScreen)

    if (!isValid) {
      this.state = null
    } else if (this.hasBounds() && state.displayBounds) {
      this.ensureWindowVisibleOnSomeDisplay()
    }
  }

  @Bind updateState(win: Electron.BrowserWindow = null) {
    win = win ?? this.winRef
    if (!win) {
      return
    }

    const { state } = this

    // Don't throw an error when window was closed
    try {
      const winBounds = win.getBounds()
      if (this.isNormal(win)) {
        state.x = winBounds.x
        state.y = winBounds.y
        state.width = winBounds.width
        state.height = winBounds.height
      }
      state.isMaximized = win.isMaximized()
      state.isFullScreen = win.isFullScreen()
      state.displayBounds = getDisplayBounds(win)
    } catch (err) {
      error("Failed to update state", err)
    }
  }

  @Bind saveState(win: Electron.BrowserWindow = null) {
    // Update window state only if it was provided
    win = win ?? this.winRef
    if (win) {
      this.updateState(win)
    }

    // Save state
    try {
      mkdir("-p", Path.dirname(this.filename))
      Fs.writeJSONSync(this.filename, this.state)
      info("Saved state", this.state)
    } catch (err) {
      // Don't care
      error("Failed to save state", err)
    }
  }

  @Bind stateChangeHandler() {
    // Handles both 'resize' and 'move'
    clearTimeout(this.stateChangeTimer)
    this.stateChangeTimer = setTimeout(this.updateState, WindowManager.EventHandlingDelay) as any
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

  enable(win: Electron.BrowserWindow) {
    if (this.winRef && this.winRef === win) {
      warn(`Window manager already enabled on window id`, win?.id)
      return
    }

    if (this.winRef) this.disable()

    const { config, state } = this
    if (config.maximize && state.isMaximized) {
      win.maximize()
    }
    if (config.fullScreen && state.isFullScreen) {
      win.setFullScreen(true)
    }

    this.winRef = win
    win.on("resize", this.stateChangeHandler)
    win.on("move", this.stateChangeHandler)
    win.on("close", this.closeHandler)
    win.on("closed", this.closedHandler)
  }

  disable() {
    const { winRef } = this
    if (winRef) {
      winRef.removeListener("resize", this.stateChangeHandler)
      winRef.removeListener("move", this.stateChangeHandler)
      if (this.stateChangeTimer) {
        clearTimeout(this.stateChangeTimer)
        this.stateChangeTimer = null
      }
      winRef.removeListener("close", this.closeHandler)
      winRef.removeListener("closed", this.closedHandler)
      this.winRef = null
    }
  }

  // Load previous state
  load() {
    try {
      if (Fs.existsSync(this.filename)) this.state = Fs.readJSONSync(this.filename)
    } catch (err) {
      error("Failed to load state", err)
    }

    // Check state validity
    this.validateState()

    // Set state fallback values
    this.state = defaults(this.state, {
      width: this.config.defaultWidth ?? 800,
      height: this.config.defaultHeight ?? 600
    })

    info("Initial state", this.state)
  }

  get x() {
    return this.state?.x ?? 0
  }

  get y() {
    return this.state?.y ?? 0
  }

  get width() {
    return this.state?.width ?? 0
  }

  get height() {
    return this.state?.height ?? 0
  }

  get displayBounds() {
    return (this.state?.displayBounds ?? !this.winRef) ? null : getDisplayBounds(this.winRef)
  }

  get isMaximized() {
    return this.state?.isMaximized
  }

  get isFullScreen() {
    return this.state?.isFullScreen
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

export default WindowManager
