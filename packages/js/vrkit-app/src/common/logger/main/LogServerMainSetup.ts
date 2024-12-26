import { Deferred } from "@3fv/deferred"
import { UPMMainService, upmMainServiceManager } from "@3fv/electron-utility-process-manager/main"
import Path from "path"
import type { LogServerRequestMap } from "../LogServerTypes"
import { LogServerClientAppender } from "../LogServerClientAppender"
import { getLoggingManager } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"

const log = console,
  entryFile = Path.resolve(__dirname, "..", "main-logserver", "electron-main-logserver.js")

class LogServerMainSetup {
  private readyDeferred_: Deferred<LogServerMainSetup>

  private appender_: LogServerClientAppender = null

  // private messageClient_: IMessageClient<LogServerRequestMap> = null
  private service_: UPMMainService<LogServerRequestMap> = null

  /**
   * Initialize the service & setup the appender for the main process
   */
  private async init() {
    if (this.readyDeferred_) {
      return this.readyDeferred_.promise
    }

    const deferred = (this.readyDeferred_ = new Deferred<LogServerMainSetup>())
    log.info(`Starting LogServerMain utilityProcess`)

    try {
      this.service_ = await upmMainServiceManager.createService<LogServerRequestMap>("logserver", entryFile)
      this.appender_ = new LogServerClientAppender(this.service_)

      log.info(`Adding LogServerClientAppender`, this.appender_)
      getLoggingManager().addAppenders(this.appender_)
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

const logServerMain = asOption(import.meta?.webpackHot?.data)
  .map((data: any) => data["logServerMain"] as LogServerMainSetup)
  .getOrCall(() => new LogServerMainSetup())

if (import.meta.webpackHot) {
  import.meta.webpackHot.addDisposeHandler(data => {
    data["logServerMain"] = logServerMain
  })
}
export default logServerMain.whenReady()
