import { isDev, isMac, WindowSizeDefault } from "./constants"
import SharedAppState, { getSharedAppStateStore } from "./services/store"

import Path from "path"
import { app, BrowserWindow } from "electron"
import { createWindowOpenHandler, resolveHtmlPath, windowOptionDefaults } from "./utils"

import { assert, defaults, signalFlag } from "vrkit-shared"

import { getLogger } from "@3fv/logger-proxy"
import { getService } from "./ServiceContainer"
import { MainWindowManager, WindowManager } from "./services/window-manager"
import * as ElectronRemote from "@electron/remote/main"
import { DashboardManager } from "./services/dashboard-manager"
import { asOption } from "@3fv/prelude-ts"
import { Deferred } from "@3fv/deferred"
import { ISharedAppState } from "vrkit-shared"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

// let electronRemote: typeof ElectronRemote = null

const BuildPaths = {
  root: app.isPackaged ? __dirname : Path.join(__dirname, "..", "..", "..", "..", "..", "build", "js"),
  dllPath: app.isPackaged ? "." : "vrkit-externals-dll",
  assets: app.isPackaged ? Path.join(process.resourcesPath, "assets") : Path.join(__dirname, "..", "assets")
}

function extendBuildPath(...parts: string[]): string {
  return Path.join(BuildPaths.root, ...parts)
}

const getAssetPath = (...paths: string[]): string => {
  return Path.join(BuildPaths.assets, ...paths)
}

let mainWindow: BrowserWindow | null = null

const windowMap = new Map<number, BrowserWindow>()

/**
 * Prepare window & attach event handlers, etc
 *
 * @param win
 * @param state
 */
function prepareWindow(state: ISharedAppState, win: BrowserWindow) {
  if (windowMap.has(win.id)) {
    info(`Window ${win.id} is already configured`)
    return
  }

  const id = win.id
  windowMap.set(id, win)

  win.on("close", () => {
    windowMap.delete(id)
  })

  const windowOpenHandler = createWindowOpenHandler((ev, result) => {
    log.info(`windowOpenHandler`, ev)
    return result
  })

  ElectronRemote.enable(win.webContents)
  win.webContents.on("render-process-gone", (event, details) => {
    error(`Renderer process crashed`, details, event)
  })

  win.on("show", () => {
    win.webContents.setWindowOpenHandler(windowOpenHandler)
    if (state.devSettings.alwaysOpenDevTools) {
      win.webContents.openDevTools()
    }
  })

  win.webContents.setWindowOpenHandler(windowOpenHandler)
  win.webContents.on("did-create-window", (newWin, details) => {
    info(`Preparing new webContents window`)
    prepareWindow(state, newWin)
  })
}

async function launch() {
  const windowManager = getService(WindowManager)
  const mainWindowManager = getService(MainWindowManager)
  const dashManager = getService(DashboardManager)
  const appState = getSharedAppStateStore(),
    { appSettings, dashboards: dashState } = appState
  const createWindow = async () => {
    mainWindow = new BrowserWindow({
      ...defaults(windowManager.createWindowOptions, WindowSizeDefault),
      backgroundColor: "black",
      show: false,
      titleBarStyle: "hidden",
      titleBarOverlay: false,
      ...windowOptionDefaults()
    })

    //electronRemote = await importDefault(import('@electron/remote/main'))
    prepareWindow(appState, mainWindow)

    app.on("browser-window-created", (_, newWin) => {
      prepareWindow(getSharedAppStateStore(), newWin)
    })

    mainWindowManager.setMainWindow(mainWindow)

    const url = resolveHtmlPath("index.html")
    if (url) {
      log.info("Resolved URL: ", url)
    }

    const firstLoadSignal = signalFlag()
    mainWindow.on("ready-to-show", () => {
      if (firstLoadSignal.set()) {
        log.warn(`Already called ready-to-show`)
        return
      }

      assert(!!mainWindow, '"mainWindow" is not defined')

      // SHOW MAIN WINDOW
      mainWindow.show()
      mainWindowManager.emit("UI_READY", mainWindow)
      
      
    })

    mainWindow.on("closed", () => {
      mainWindow = null

      log.info(`Main window closed, exiting app`)
      app.quit()
      app.exit(0)
      
      Deferred.delay(200).then(() => {
        const pid = process.pid
        console.info(`Exiting process`)
        
        process.kill(pid)
        process.exit(0)
        
      })
      
    })

    await mainWindow.loadURL(url).catch(err => log.error("Failed to load url", url, err))
    // const menuBuilder = new MenuBuilder(mainWindow)
    // menuBuilder.buildMenu()
    //
    // Open urls in the user's browser
    // mainWindow.webContents.setWindowOpenHandler(edata => {
    //   shell.openExternal(edata.url)
    //   return { action: "allow" }
    // })
  }

  /**
   * Add event listeners...
   */

  app.on("window-all-closed", () => {
    if (!isMac) {
      app.quit()
    }
  })

  const windowPromise: Promise<void> = createWindow()

  app.on("activate", async () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!windowPromise) {
      if (mainWindow === null) {
        await createWindow()
      }
    }
  })
  return windowPromise
}

export default launch()
