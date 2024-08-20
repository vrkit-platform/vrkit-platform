import { Deferred } from "@3fv/deferred"
import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { ActionRegistry } from "vrkit-app-common/services"
import { APP_DB_ID, APP_STORE_ID, isSharedWorkerEnabled } from "./constants"

import WebActionManager from "./services/web-action-manager"

import {
  setContainerResolver
} from "./utils"
import { isDev } from "./constants"

const log = getLogger(__filename)
const { debug, info, trace, warn, error } = log

let containerDeferred: Deferred<Container>

/**
 * Create and cache container
 *
 * @returns {Promise<Container>}
 */
async function createContainer(): Promise<Container> {
  try {
    debug(`Loading AppStore`)
    const { default: appStore } = await import("./services/store/AppStore")

    let container = new Container()
    if (isDev) {
      Object.assign(window, {
        ditsyContainer: container
      })
    }

    container = await container
      .bindConstant(APP_STORE_ID, appStore)
      .bindClass(ActionRegistry)
      .bindClass(WebActionManager)
      .resolveAll()

    // container = await container.resolveAll()
    containerDeferred.resolve(container)

    info(`Container fully resolved & ready to rock`)
    const bootstrapCtx = require.context(
        "./bootstrap/init-scripts",
        false,
        /\.tsx?$/,
        "lazy"
      ),
      bootstrapKeys = bootstrapCtx.keys().sort()

    info(`Executing init: ${bootstrapKeys.join(",")}`)
    for (const key of bootstrapKeys) {
      await bootstrapCtx(key).then(
        ({ default: initFn }) => initFn(container) as Promise<void>
      )
    }
  } catch (err) {
    error(`failed to create the services container`, err)
    containerDeferred.reject(err)
  }
  return containerDeferred.promise
}

/**
 * Get the container, create
 * if missing & ensure all services are resolved
 *
 * @returns {Promise<Container>}
 */
export function resolveContainer(): Deferred<Container> {
  if (!containerDeferred) {
    containerDeferred = new Deferred<Container>()
    setContainerResolver(containerDeferred)
    containerDeferred.promise.catch(err => {
      log.error(`Failed to create container`, err)
      return err
    })
    createContainer()
  }
  return containerDeferred
}
