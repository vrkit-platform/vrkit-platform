import { getLoggingManager, Level } from "@3fv/logger-proxy"
import { isDev } from "./renderer-constants"

const loggingManager = getLoggingManager()

loggingManager.setRootLevel(isDev ? Level.info : Level.warn)

if (isDev) {
  const g = typeof window !== "undefined" ? window : typeof SharedWorkerGlobalScope !== "undefined" ? SharedWorkerGlobalScope : global
  Object.assign(g, {
    loggingManager
  })
}
console.info("isDev",isDev)

export {}
