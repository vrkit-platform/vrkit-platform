import { isDev, isMac, WindowSizeDefault } from "./constants"

import Path from "path"
import type { NativeImage, Rectangle } from "electron"
import { app, BrowserWindow } from "electron"
import { createWindowOpenHandler, resolveHtmlPath, windowOptionDefaults } from "./utils"
import { Option } from "@3fv/prelude-ts"

import { defaults, signalFlag } from "vrkit-app-common/utils"

import { getLogger } from "@3fv/logger-proxy"
import { getService } from "./ServiceContainer"
import { MainWindowManager, WindowManager } from "./services/window-manager"
import * as ElectronRemote from "@electron/remote/main"
import { getValue } from "@3fv/guard"

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
 */
function prepareWindow(win: BrowserWindow) {
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
  win.webContents.on('render-process-gone', (event, details) => {
    error(`Renderer process crashed`, details, event)
  })
    
    win.on("show", () => {
    win.webContents.setWindowOpenHandler(windowOpenHandler)
    if (isDev) {
      win.webContents.openDevTools()
    }
  })
  
  win.webContents.setWindowOpenHandler(windowOpenHandler)
  win.webContents.on("did-create-window", (newWin, details) => {
    info(`Preparing new webContents window`)
    prepareWindow(newWin)
  })
}

async function launch() {
  const windowManager = getService(WindowManager)
  const mainWindowManager = getService(MainWindowManager)

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
    prepareWindow(mainWindow)

    app.on("browser-window-created", (_, newWin) => {
      prepareWindow(newWin)
    })
    
    mainWindowManager.setMainWindow(mainWindow)

    const url = resolveHtmlPath("index.html")
      if (url)
        console.info("Resolved URL: ", url)
      
    const firstLoadSignal = signalFlag()
    mainWindow.on("ready-to-show", () => {
      firstLoadSignal.toggle()

      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined')
      }

      // Open devtools in `development` automatically
      mainWindow.show()
    })

    mainWindow.on("closed", () => {
      mainWindow = null
    })
    
    await mainWindow.loadURL(url).catch(err => console.error("Failed to load url", url, err))
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
    if (!windowPromise) if (mainWindow === null) await createWindow()
  })
  return windowPromise
}

export default launch()
