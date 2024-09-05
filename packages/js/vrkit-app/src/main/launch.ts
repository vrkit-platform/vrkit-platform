import { isDev, isMac, WindowSizeDefault } from "./constants"

import Path from "path"
import { app, BrowserWindow, shell } from "electron"
import { resolveHtmlPath } from "./utils"
import { Option } from "@3fv/prelude-ts"
import iconPng from "../assets/icons/icon.png"
import { defaults } from "vrkit-app-common/utils"

import { getLogger } from "@3fv/logger-proxy"
import { getService } from "./ServiceContainer"
import { WindowManager } from "./services/window-manager"


const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log




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

async function launch() {
  const windowManager = getService<WindowManager>(WindowManager)

  const createWindow = async () => {
    mainWindow = new BrowserWindow({
      ...defaults(windowManager.createWindowOptions, WindowSizeDefault),
      show: false,
      titleBarStyle: "hidden",
      titleBarOverlay: false,
      icon: iconPng,
      backgroundColor: "#00000000",
      resizable: true,
      
      webPreferences: {
        allowRunningInsecureContent: true,
        webSecurity: false,
        nodeIntegration: true,
        nodeIntegrationInSubFrames: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false,
        sandbox: false,
        devTools: isDev
      }
    })
    
    require('@electron/remote/main').enable(mainWindow.webContents)
    
    
    windowManager.enable(mainWindow)

    Option.of(resolveHtmlPath("index.html"))
      .ifSome(url => console.info("Resolved URL: ", url))
      .map(url =>
        mainWindow
          .loadURL(url)
          .catch(err => console.error("Failed to load url", url, err))
      )

    let firstLoad = true
    mainWindow.on("ready-to-show", async () => {
      if (firstLoad) {
        // mainWindow.webContents.devToolsWebContents.reload()
        firstLoad = false
      }
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined')
      }

      // Open devtools in `development` automatically
      mainWindow.show()

      if (isDev) {
        mainWindow.webContents.openDevTools()
      }
    })

    mainWindow.on("closed", () => {
      mainWindow = null
    })

    // const menuBuilder = new MenuBuilder(mainWindow)
    // menuBuilder.buildMenu()
    //
    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler(edata => {
      shell.openExternal(edata.url)
      return { action: "allow" }
    })
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
