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
import "./ShutdownManager"

import { app } from "electron"
import * as ElectronRemote from "@electron/remote/main"
import { Deferred } from "@3fv/deferred"
import { shutdownServiceContainer } from "./ServiceContainer"

const ConsoleLevels: Array<keyof Console> = ["debug", "info", "error", "warn"],
  [debug, info, error, warn] = ConsoleLevels.map(level => (...args: any[]) => {
    ;(console as any)[level](...args)
  }) 

const ProcPaths = {
  cwd: process.cwd(),
  argv: process.argv,
  execPath: process.execPath,
  resources: process.resourcesPath
}

info(`ProcPaths`, ProcPaths)

async function start() {
  info(`Starting entry-main`)
  try {
    await import("./utils/ProcessErrorHelpers")

    info(`Init electron remote`)
    if (!ElectronRemote.isInitialized()) {
      ElectronRemote.initialize()
    }

    info(`Init Log Server`)
    const logServerInit = await import("../common/logger/main").then(mod => mod.default)
    info(`Waiting for Log Server`)
    await logServerInit.whenReady()

    info(`Init BootStrap`)
    await import("./bootstrap/bootstrapElectronMain").then(mod => mod.default)

    info(`Launch`)
    await import("./launch").then(mod => mod.default)
  } catch (err) {
    error(`Failed to start`, err)
    if (!isDev) {
      ShutdownManager.shutdown().catch(err => {
        error(`Shutdown failed`, err)
      })
    }
    // throw err
  }
}

// SETUP PROCESS & APP EVENT HANDLERS
if (app.requestSingleInstanceLock()) {
  app.whenReady().then(start)
} else {
  warn(`Another instance already exists`)
  app.quit()
}

// IN DEV ENVIRONMENTS, EXPOSE `GetLogger -> getLogger` GLOBALLY
if (isDev) {
  global["GetLogger"] = require("@3fv/logger-proxy").getLogger
}

// HMR
if (import.meta.webpackHot) {
  import.meta.webpackHot.addDisposeHandler(_data => Promise.all([shutdownServiceContainer(), Deferred.delay(2000)]))

  import.meta.webpackHot.accept(
    ["../common/logger/main", "./utils/ProcessErrorHelpers", "./bootstrap/bootstrapElectronMain", "./launch"],
    (...args: any[]) => {
      warn(`entry-main HMR accept`, ...args)
      // NOTE: Delay is required to allow for async cleanup/disposal to complete

      return start()
        .then(() => info(`HMR Start complete`))
        .catch(err => {
          error(`HMR Start failed`, err)
          ShutdownManager.shutdown()
        })
    },
    err => {
      error(`HMR UPDATE FAILED`, err)
    }
  )
}

export {}
