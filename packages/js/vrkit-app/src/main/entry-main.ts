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

import { app } from "electron"
import { importDefault } from "vrkit-shared"
import { getLogger } from "@3fv/logger-proxy"
import * as ElectronRemote from "@electron/remote/main"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

process.on("uncaughtException",(...args:any[]) => {
  error("uncaughtException", args)
})

process.on("unhandledRejection",(...args:any[]) => {
  error("unhandledRejection", args)
})

async function start() {
  if (!ElectronRemote.isInitialized())
    ElectronRemote.initialize()
  
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
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(() => {
    log.warn("HMR updates")
  })
}

export {}

