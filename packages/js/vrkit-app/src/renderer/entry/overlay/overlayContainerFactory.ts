// noinspection DuplicatedCode

import { Deferred } from "@3fv/deferred"
import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"

import { setContainerResolver } from "../../utils"
import { isDev } from "../../constants"
import FileSystemManager from "../../services/file-system-manager"
import TrackManager from "../../services/track-manager"
import OverlayClient, { PluginClientManager } from "../../services/overlay-client"
import OverlayWindowControls from "vrkit-app-renderer/services/overlay-window-controls"

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
    debug(`Creating service container for overlay window`)

    let container = new Container()
    if (isDev) {
      Object.assign(window, {
        ditsyContainer: container
      })
    }

    container = await container
      .bindClass(OverlayWindowControls)
      .bindClass(FileSystemManager)
      .bindClass(TrackManager)
      .bindClass(OverlayClient)
      .bindClass(PluginClientManager)
      .resolveAll()

    // container = await container.resolveAll()
    containerDeferred.resolve(container)

    info(`Container fully resolved & ready to rock`)
    const bootstrapCtx = require.context("./init-scripts", false, /\.tsx?$/, "lazy"),
      bootstrapKeys = bootstrapCtx.keys().sort()

    info(`Executing init: ${bootstrapKeys.join(",")}`)
    for (const key of bootstrapKeys) {
      await bootstrapCtx(key).then(({ default: initFn }) => initFn(container) as Promise<void>)
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
      .then(() => log.info("Resolved container"))
      .catch(err => log.error("Failed to resolve container", err))
  }
  return containerDeferred
}
