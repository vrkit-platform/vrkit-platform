import { Deferred } from "@3fv/deferred"
import { upmMainServiceManager, UPMMainService } from "vrkit-app-common/upm/main"
import Path from "path"
import { LogServerMessageArgs } from "vrkit-app-common/logger/LogServerTypes"

const log = console,
    entryFile = Path.resolve(__dirname, "..", "main-logserver", "electron-main-logserver.js")

class LogServerMain {
  
  private readyDeferred_:Deferred<LogServerMain>
  
  private service_: UPMMainService<LogServerMessageArgs> = null
  
  /**
   * Initialize the service & setup the appender for the main process
   */
  private async init() {
    if (this.readyDeferred_)
      return this.readyDeferred_.promise
    
    const deferred = this.readyDeferred_ = new Deferred<LogServerMain>()
    log.info(`Starting LogServerMain utilityProcess`)
    
    try {
      this.service_ = await upmMainServiceManager.createService("logserver", entryFile)
      
      deferred.resolve(this)
      return this
    } catch (err) {
      log.error(`Unable to start UPM logserver process`, err)
      deferred.reject(err)
      throw err
    }
  }
  
  whenReady() {
    return this.readyDeferred_.promise
  }
  
  constructor() {
    
    this.init()
        .catch(err => {
log.error(`Unable to initialize LogServerMain`, err)          
        })
  }
}

const logServerMain = new LogServerMain()

export default logServerMain.whenReady()