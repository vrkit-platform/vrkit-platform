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
import "./prepareElectronMain"

import { app, BrowserWindow, ipcMain, session, shell } from "electron"
import { defaults, importDefault } from "vrkit-app-common/utils"
import { Deferred } from "@3fv/deferred"
import { getLogger } from "@3fv/logger-proxy"


const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log


async function start() {
  await importDefault(import("./bootstrap"))
  await importDefault(import("./launch"))
}

// SETUP PROCESS & APP EVENT HANDLERS
if (app.requestSingleInstanceLock()) {
  app.whenReady().then(start)
} else {
  log.warn(`Another instance already exists`)
  app.quit()
}

// HMR
if (module.hot) {
  module.hot.accept(() => {
    log.warn("HMR updates")
  })
}

export {}

