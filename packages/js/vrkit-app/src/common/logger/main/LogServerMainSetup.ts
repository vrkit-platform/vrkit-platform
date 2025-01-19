import { Deferred } from "@3fv/deferred"
import { UPMMainService, upmMainServiceManager } from "@3fv/electron-utility-process-manager/main"
import Path from "path"
import type { LogServerRequestMap } from "../LogServerTypes"
import { LogServerClientAppender } from "../LogServerClientAppender"
import { Appender, ConsoleAppender, getLoggingManager } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"
import { isDefined } from "@3fv/guard"
import { filter, flow } from "lodash/fp"

const log = console,
  entryFile = Path.resolve(__dirname, "..", "main-logserver", "electron-main-logserver.js")

class LogServerMainSetup {
  #readyDeferred: Deferred<LogServerMainSetup>

  #appenders: Appender[] = []

  #service: UPMMainService<LogServerRequestMap> = null
  
  /**
   * Install the internal appenders
   *
   * @param appenders
   * @private
   */
  #installAppenders(appenders: Appender[]) {
    this.#appenders.length = 0
    this.#appenders.push(...appenders)
    log.info(`Adding Appenders`, this.#appenders)
    getLoggingManager().setAppenders(this.#appenders)
  }
  
  /**
   * Initialize the service & setup the appender for the main process
   */
  protected async init() {
    if (this.#readyDeferred) {
      return this.#readyDeferred.promise
    }

    const deferred = (this.#readyDeferred = new Deferred<LogServerMainSetup>())
    log.info(`Starting LogServerMain utilityProcess`)

    try {
      // Create the UPM service
      const service = this.#service = await upmMainServiceManager.createService<LogServerRequestMap>("logserver", entryFile)
      
      // Setup appenders
      const logServerClientAppender = new LogServerClientAppender(this.#service)
      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          logServerClientAppender.closeImmediate()
          service.close()
        })
      }
      flow(filter(isDefined), this.#installAppenders.bind(this))([
        isDev && new ConsoleAppender(),
        logServerClientAppender
      ])

      
      deferred.resolve(this)
      return this
    } catch (err) {
      log.error(`Unable to start UPM logserver process`, err)
      deferred.reject(err)
      throw err
    }
  }

  whenReady() {
    return this.init()
  }

  constructor() {
    Object.assign(global, {
      logServerMain: this
    })
    this.init().catch(err => {
      log.error(`Unable to initialize LogServerMain`, err)
    })
  }
}

const logServerMain = new LogServerMainSetup()
// asOption(import.meta?.webpackHot?.data)
//   .map((data: any) => data["logServerMain"] as LogServerMainSetup)
//   .getOrCall(() => )

// if (import.meta.webpackHot) {
//   import.meta.webpackHot.addDisposeHandler(data => {
//     data["logServerMain"] = logServerMain
//   })
// }
export default logServerMain
