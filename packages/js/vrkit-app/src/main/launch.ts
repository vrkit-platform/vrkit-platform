import { getLogger } from "@3fv/logger-proxy"
import { getService } from "./ServiceContainer"
import {
  WindowMainInstance, WindowManager, WindowStateManager
} from "./services/window-manager"
import { Deferred } from "@3fv/deferred"
import { WindowRole } from "@vrkit-platform/shared"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

Object.assign(global, {
  webpackRequire: __webpack_require__,
  webpackModules: __webpack_modules__,
  nodeRequire: __non_webpack_require__
})


let wi:WindowMainInstance = null
let createWindowDeferred:Deferred<WindowMainInstance> = null

async function launch() {
  const
      windowManager = getService(WindowManager),
      createWindow = async () => {
        if (createWindowDeferred)
          return createWindowDeferred.promise
        
        createWindowDeferred = new Deferred<WindowMainInstance>()
        try {
          wi = await windowManager.create(WindowRole.Main)
          createWindowDeferred.resolve(wi)
        } catch (err) {
          log.error(`Failed to create main window`, err)
          createWindowDeferred.reject(err)
        }
  }

  return createWindow()
}

export default launch()
