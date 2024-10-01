import { getLogger } from "@3fv/logger-proxy"
import Bluebird from "bluebird"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

type BootstrapStep = [description: string, fn: () => Promise<any>]
type InitScriptModule = { default: () => Promise<void> }

const bootstrapCtx = require.context("./init-scripts", false, /\.ts$/),
  bootstrapKeys = bootstrapCtx.keys().sort()


async function bootstrapElectronMain() {
  // const timer = Timer.create()
  // timer.start()
  // const bootstrapEnd = timer.time("bootstrap")
  info(`Bootstrap started`)



  info(`Executing init: ${bootstrapKeys.join(",")}`)

  await Bluebird.each(bootstrapKeys, (key, index) =>
    Promise.resolve(bootstrapCtx(key)).then(
      async ({ default: initFn }: InitScriptModule) => {
        info(`[${index}] (Start): ${key}`)
        // const end = timer.time(`[${index}]: ${key}`)
        try {
          await initFn()
          info(`[${index}] (End): ${key}`)
        } catch (err) {
          error(`[${index}] (Failed): ${key}`, err)
          throw err
        } finally {
          // info(`[${index}] (Duration): ${end()}`)
        }
      }
    )
  )
}


// HMR
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(bootstrapKeys, () => {
    log.warn("HMR updates")
  })
}


export default bootstrapElectronMain()
