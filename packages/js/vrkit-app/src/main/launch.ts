import { isDev, isMac, WindowSizeDefault } from "./constants"

import Path from "path"
import type { NativeImage, Rectangle } from "electron"
import { app, BrowserWindow, shell } from "electron"
import { resolveHtmlPath } from "./utils"
import { Option } from "@3fv/prelude-ts"

import { defaults, signalFlag } from "vrkit-app-common/utils"

import { getLogger } from "@3fv/logger-proxy"
import { getService } from "./ServiceContainer"
import { WindowManager } from "./services/window-manager"
import { HandlerDetails, WindowOpenHandlerResponse } from "electron/main"
import * as ElectronRemote from "@electron/remote/main"
import { getValue } from "@3fv/guard"
import { windowOptionDefaults } from "./utils"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

// let electronRemote: typeof ElectronRemote = null

const BuildPaths = {
  root: app.isPackaged
    ? __dirname
    : Path.join(__dirname, "..", "..", "..", "..", "..", "build", "js"),
  dllPath: app.isPackaged ? "." : "vrkit-externals-dll",
  assets: app.isPackaged
    ? Path.join(process.resourcesPath, "assets")
    : Path.join(__dirname, "..", "assets")
}

function extendBuildPath(...parts: string[]): string {
  return Path.join(BuildPaths.root, ...parts)
}

const getAssetPath = (...paths: string[]): string => {
  return Path.join(BuildPaths.assets, ...paths)
}

let mainWindow: BrowserWindow | null = null


/**
 * Handles window open requests in a renderer window
 *
 * @param ev
 */
const windowOpenHandler = (ev: HandlerDetails): WindowOpenHandlerResponse => {
  log.info(`windowOpenHandler`, ev)
  return {
    action: "allow",
    overrideBrowserWindowOptions: {
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      ...windowOptionDefaults()
    }
  }
}

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

  
  const onFrameCallback = (image: NativeImage, _dirtyRect: Rectangle) => {
    getValue(
      () => {
        info(
          `onFrameCallback window buffer received ${id} (${image.getBitmap().length} bytes)`
        )
      },
      null,
      err => {
        error(`Unable to get handle?`, err)
      }
    )
  }

  win.on("close", () => {
    windowMap.delete(id)
  })

  if (win !== mainWindow) {
    win.on("show", () => {
      win.webContents.beginFrameSubscription(false, onFrameCallback)
    })
  }

  ElectronRemote.enable(win.webContents)
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
  const windowManager = getService<WindowManager>(WindowManager)

  const createWindow = async () => {
    mainWindow = new BrowserWindow({
      ...defaults(windowManager.createWindowOptions, WindowSizeDefault),
      backgroundColor: "black",
      show: false,
      ...windowOptionDefaults()
    })

    //electronRemote = await importDefault(import('@electron/remote/main'))
    prepareWindow(mainWindow)

    app.on("browser-window-created", (_, newWin) => {
      prepareWindow(newWin)
    })

    windowManager.enable(mainWindow)

    Option.of(resolveHtmlPath("index.html"))
      .ifSome(url => console.info("Resolved URL: ", url))
      .map(url =>
        mainWindow
          .loadURL(url)
          .catch(err => console.error("Failed to load url", url, err))
      )

    const firstLoadSignal = signalFlag()
    mainWindow.on("ready-to-show", async () => {
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
