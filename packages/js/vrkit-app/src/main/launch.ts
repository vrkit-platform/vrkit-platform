import { isMac, WindowSizeDefault } from "./constants"
import { getSharedAppStateStore } from "./services/store"
import Fsx from "fs-extra"
import Path from "path"
import { app, BrowserWindow } from "electron"
import { createWindowOpenHandler, resolveHtmlPath, windowOptionDefaults } from "./utils"

import { assert, defaults, ISharedAppState, signalFlag } from "@vrkit-platform/shared"

import { getLogger } from "@3fv/logger-proxy"
import { getService } from "./ServiceContainer"
import { MainWindowManager, WindowManager } from "./services/window-manager"
import * as ElectronRemote from "@electron/remote/main"
import { DashboardManager } from "./services/dashboard-manager"
import { Deferred } from "@3fv/deferred"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

// let electronRemote: typeof ElectronRemote = null

Object.assign(global, {
  webpackRequire: __webpack_require__,
  webpackModules: __webpack_modules__,
  nodeRequire: __non_webpack_require__
})

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
function prepareWindow(state: ISharedAppState, win: BrowserWindow, isMainWindow: boolean = false) {
  if (windowMap.has(win.id)) {
    warn(`Window ${win.id} is already configured`)
    return
  }

  const { id } = win
  windowMap.set(id, win)

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
      windowMap.delete(id)
    })
    .on("show", () => {
      win.webContents.setWindowOpenHandler(windowOpenHandler)
      if (state.devSettings.alwaysOpenDevTools) {
        win.webContents.openDevTools()
        // win.webContents.openDevTools({
        //   mode: isMainWindow ? "right" : "detach"
        // })
      }
    })

  // ATTACH WEB CONTENT HANDLERS
  win.webContents
    .on("render-process-gone", (event, details) => {
      error(`Renderer process crashed`, details, event)
    })
    .on("did-create-window", (newWin, details) => {
      info(`Preparing new webContents window`)
      prepareWindow(state, newWin, newWin?.id === mainWindow?.id)
    })
    .on("devtools-opened", () => {
      asOption(BuildPaths.root)
        .filter(Fsx.existsSync)
        .ifSome(rootDir => {
          win.webContents.addWorkSpace(Path.resolve(rootDir))
          state.devSettings.workspaceSourcePaths
            .filter(dir => Fsx.pathExistsSync(dir))
            .forEach(dir => win.webContents.addWorkSpace(dir))
        })
    })
    .setWindowOpenHandler(windowOpenHandler)
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
      ...windowOptionDefaults()
    })

    prepareWindow(appState, mainWindow, true)

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
