import killAll from "tree-kill"
import { Deferred } from "@3fv/deferred"
import { guard } from "@3fv/guard"
import { app, BrowserWindow } from "electron"

let shutdownDeferred: Deferred<void> = null
let triggerCount = 0


namespace ShutdownManagerImpl {
  export async function shutdown() {
    triggerCount++
    console.info(`Shutdown triggered (count=${triggerCount})`)
    if (shutdownDeferred) {
      console.warn(`Shutdown in progress (count=${triggerCount})`)
      return shutdownDeferred.promise
    }
    
    shutdownDeferred = new Deferred()
    
    const { getSharedAppStateStore } = await import( "./services/store")
    const { shutdownServiceContainer } = await import ("./ServiceContainer")
    
    console.warn("QUIT INVOKED")
    const store = getSharedAppStateStore()
    store.setShutdownInProgress()
    
    const closeAllWindows = () => {
      BrowserWindow.getAllWindows().forEach(w => guard(() => !w.isDestroyed() &&
        w.close()))
    }
    
    console.warn("START SHUTDOWN SERVICE CONTAINER")
    await shutdownServiceContainer()
    console.warn("SHUTDOWN SERVICE CONTAINER COMPLETE")
    Deferred.delay(500).then(() => {
      console.warn("Starting FORCE KILL")
      closeAllWindows()
      killAll(process.pid, "SIGKILL")
      process.kill(process.pid)
      app.quit()
      process.exit(0)
    })
    closeAllWindows()
    app.quit()
    killAll(process.pid, "SIGKILL")
    process.exit(0)
    
  }
}

//export default ShutdownManager
Object.assign(global, {
  ShutdownManager: ShutdownManagerImpl
})

declare global {
  const ShutdownManager: typeof ShutdownManagerImpl
}


if (isDev && import.meta.webpackHot) {
  const hot = import.meta.webpackHot
  hot.addDisposeHandler(() => {
    Object.assign(global, {
      ShutdownManager
    })
  })
  hot.accept()
}

export {}