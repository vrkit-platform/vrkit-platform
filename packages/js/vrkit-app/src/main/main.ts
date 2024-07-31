/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled
 * to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import Path from "path"
import { app, BrowserWindow, shell, ipcMain } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"
import MenuBuilder from "./menu"
import { resolveHtmlPath } from "./util"
import { Option } from "prelude-ts"

const BuildPaths = {
  root: app.isPackaged ?
      __dirname :
      Path.join(__dirname, "..", "..", "..", "..", "..", "build", "js"),
  dllPath: app.isPackaged ? "." : "vrkit-externals-dll",
  assets: app.isPackaged ?
      Path.join(process.resourcesPath, "assets") :
      Path.join(__dirname, "../../assets")
}

function extendBuildPath(...parts:string[]):string {
  return Path.join(BuildPaths.root, ...parts)
}

const getAssetPath = (...paths:string[]):string => {
  return Path.join(BuildPaths.assets, ...paths)
}


class AppUpdater {
  constructor() {
    log.transports.file.level = "info"
    autoUpdater.logger = log
    autoUpdater.checkForUpdatesAndNotify()
        .catch(err => console.error("Failed to check for updates", err))
  }
}

let mainWindow:BrowserWindow | null = null

ipcMain.on("ipc-example", async (event, arg) => {
  const msgTemplate = (pingPong:string) => `IPC test: ${pingPong}`
  console.log(msgTemplate(arg))
  event.reply("ipc-example", msgTemplate("pong"))
})

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support")
  sourceMapSupport.install()
}

const isDebug = process.env.NODE_ENV ===
    "development" ||
    process.env.DEBUG_PROD ===
    "true"

function loadApp() {
  
  const installExtensions = async () => {
    const installer = require("electron-devtools-installer")
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS
    const extensions = ["REACT_DEVELOPER_TOOLS"]
    
    return installer
        .default(extensions.map((name) => installer[name]), forceDownload)
        .catch(console.log)
  }
  
  
  const createWindow = async () => {
    if (isDebug) {
      await installExtensions()
    }
    
    
    mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      icon: getAssetPath("icons", "icon.png"),
      webPreferences: {
        preload: extendBuildPath(BuildPaths.dllPath, "preload.js"),
        nodeIntegration: true
      }
    })
    
    Option.of(resolveHtmlPath("index.html"))
        .ifSome(url => console.info("Resolved URL: ", url))
        .map(url => mainWindow.loadURL(url)
            .catch(err => console.error("Failed to load url", url, err)))
    
    mainWindow.on("ready-to-show", () => {
      if (!mainWindow) {
        throw new Error("\"mainWindow\" is not defined")
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize()
      } else {
        mainWindow.show()
      }
    })
    
    mainWindow.on("closed", () => {
      mainWindow = null
    })
    
    const menuBuilder = new MenuBuilder(mainWindow)
    menuBuilder.buildMenu()
    
    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url)
      return { action: "deny" }
    })
    
    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater()
  }
  
  /**
   * Add event listeners...
   */
  
  app.on("window-all-closed", () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== "darwin") {
      app.quit()
    }
  })
  
  app
      .whenReady()
      .then(() => {
        const windowPromise = createWindow()
        
        app.on("activate", () => {
          // On macOS it's common to re-create a window in the app when the
          // dock icon is clicked and there are no other windows open.
          if (mainWindow === null) createWindow()
              .catch(console.error)
        })
        return windowPromise
      })
      .catch(console.log)
}
// if (isDebug) {
//   import("electron-debug").then(mod => {
//     mod.default()
//   }).then(loadApp)
// } else {
  loadApp()
// }

export {}

// // main.js
//
// // Modules to control application life and create native browser window
// import { app, BrowserWindow } from "electron"
//
// import Path from "node:path"
// const createWindow = () => {
//
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: Path.join(__dirname, 'preload.js')
//     }
//   })
//
//   // and load the index.html of the app.
//   mainWindow.loadFile(Path.join(__dirname,"assets/html/index.html"))
//
//   // Open the DevTools.
//   // mainWindow.webContents.openDevTools()
// }
//
// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   require('vrkit-native-interop')
//   createWindow()
//
//   app.on('activate', () => {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })
//
// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit()
// })
//
// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.