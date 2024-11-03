import { autoUpdater, UpdateCheckResult } from "electron-updater"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

class AppUpdater {
  private state = {
    pendingCheck: null as Promise<UpdateCheckResult | null>,
    checkResult: null as UpdateCheckResult
  }
  get pendingCheck() {return this.state.pendingCheck}
  
  get checkResult() {return this.state.checkResult}
    
  constructor() {
    autoUpdater.logger = log
    // noinspection JSIgnoredPromiseFromCall
    this.checkForUpdates()    
  }

  checkForUpdates() {
    if (!this.state.pendingCheck) {
      this.state.pendingCheck = autoUpdater
        .checkForUpdatesAndNotify()
        .then(result => {
          this.state.checkResult = result
          info("Check result received", result)
          return result
        })
        .catch(err => {
          error("Failed to check for updates", err)
          return null
          //throw err
        })
        .finally(() => {
          this.state.pendingCheck = null
        })
    }
    return this.pendingCheck
  }
}

export default async function configureUpdater() {
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater()
}
