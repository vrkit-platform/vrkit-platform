import { getLogger } from "@3fv/logger-proxy"
import Bluebird from "bluebird"
import { app } from "electron"
import { Timer } from "timer-node"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

type BootstrapStep = [description: string, fn: () => Promise<any>]
type InitScriptModule = { default: () => Promise<void> }

if (isDev) {
  global["nodeRequire"] = function (modName: string) {
    return __non_webpack_require__(modName)
  }
}

const bootstrapCtx = require.context("./init-scripts", false, /\.ts$/),
  bootstrapKeys = bootstrapCtx.keys().sort()

async function bootstrapElectronMain() {
  info(`Bootstrap (Start)`)
  const bootstrapTimer = new Timer({
    label: "bootstrap"
  })

  info(`Executing init: ${bootstrapKeys.join(",")}`)
  
  try {
    await Bluebird.each(
      bootstrapKeys,
      (key, index) => Promise.resolve(bootstrapCtx(key))
        .then(async ({ default: initFn }:InitScriptModule) => {
          info(`[${index}] ${key} >> (Start)`)
          const modTimer = new Timer({ label: `[${index}]: ${key}` })
          try {
            await initFn()
          } catch (err) {
            error(`[${index}] (Failed): ${key}`, err)
            throw err
          } finally {
            modTimer.stop()
            info(`[${index}] ${key} >> (End) >> ${modTimer.ms()}ms`)
          }
        })
    )
  } catch (err) {
    error(`Bootstrap FAILED`, err)
    if (typeof VRKitReportMainFatalError === "function") {
      VRKitReportMainFatalError("uncaughtException", "Bootstrap failed", err)
    }
    
    if (isDev) {
      warn(`In Dev mode we do not force quit on failure`)
    } else {
      app.quit()
      process.exit(1)
    }
    
    throw err
  } finally {
    info(`Bootstrap (End) >> ${bootstrapTimer.ms()}ms`)
  }
}

// HMR
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(bootstrapKeys, (...args) => {
    log.warn("Bootstrap HMR", ...args)
    bootstrapElectronMain()
  })
}

export default bootstrapElectronMain()
