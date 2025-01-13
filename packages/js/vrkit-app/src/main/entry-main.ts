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
import { getLogger } from "@3fv/logger-proxy"
import * as ElectronRemote from "@electron/remote/main"
import { isPromise } from "@3fv/guard"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log


async function start() {
  await import("./utils/ProcessErrorHelpers")
  
  if (!ElectronRemote.isInitialized())
    ElectronRemote.initialize()
  
  const logServerInit = await import("../common/logger/main").then(mod => mod.default)
  if (isPromise(logServerInit)) {
    await logServerInit
  }
  
  await import("./bootstrap").then(mod => mod.default)
  await import("./launch").then(mod => mod.default)
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
  import.meta.webpackHot.accept((...args) => {
    console.warn(`entry-main HMR accept`, ...args)
    // if (err) {
    //   log.error(`HMR ERROR`, err)
    // } else {
    //   log.warn("HMR updates")
    // }
  })
}

export {}

