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
import { Deferred } from "@3fv/deferred"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

const ProcPaths = {
  cwd: process.cwd(),
  argv: process.argv,
  execPath: process.execPath,
  resources: process.resourcesPath
}

console.info(`ProcPaths`, ProcPaths)

async function start() {
  console.info(`Starting entry-main`)
  try {
    await import("./utils/ProcessErrorHelpers")

    console.info(`Init electron remote`)
    if (!ElectronRemote.isInitialized()) {
      ElectronRemote.initialize()
    }

    console.info(`Init Log Server`)
    const logServerInit = await import("../common/logger/main").then(mod => mod.default)
    if (isPromise(logServerInit)) {
      console.info(`Waiting for Log Server`)
      await logServerInit
    }

    console.info(`Init BootStrap`)
    await import("./bootstrap/bootstrapElectronMain").then(mod => mod.default)

    console.info(`Launch`)
    await import("./launch").then(mod => mod.default)
  } catch (err) {
    console.error(`Failed to start`, err)
    if (!isDev) {
      app.quit()
      process.exit(1)
    }
    throw err
  }
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
  import.meta.webpackHot.accept(
    ["../common/logger/main", "./utils/ProcessErrorHelpers", "./bootstrap/bootstrapElectronMain", "./launch"],
    (...args) => {
      console.warn(`entry-main HMR accept`, ...args)
      // NOTE: Delay is required to allow for async cleanup/disposal to complete
      Deferred.delay(1500)
        .then(() => start())
        .then(() => console.info(`HMR Start complete`))
        .catch(err => {
          console.error(`HMR Start failed`, err)
          app.quit()
          process.exit(1)
        })
    }
  )
}

export {}
