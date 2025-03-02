// noinspection DuplicatedCode

import { Deferred } from "@3fv/deferred"
import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { ActionRegistry } from "@vrkit-platform/shared"
import { WebActionManager } from "../../services/actions-web"
import SessionManagerClient from "../../services/session-manager-client"

import { APP_STORE_ID, isDev } from "../../renderer-constants"

import { setContainerResolver } from "../../utils"
import { FileSystemManager } from "@vrkit-platform/shared/services/node"
import TrackManager from "../../services/track-manager"
import SharedAppStateClient from "../../services/shared-app-state-client"
import { DashboardManagerClient } from "../../services/dashboard-manager-client"
import AppSettingsClient from "../../services/app-settings-client"
import { OverlayManagerClient } from "../../services/overlay-manager-client"
import { Alert, APP_ALERTS_ID } from "../../services/alerts"
import { PluginManagerClient } from "../../services/plugin-manager-client"

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
    const { default: appStore } = await import("../../services/store/AppStore")

    let container = new Container()
    if (isDev) {
      Object.assign(window, {
        ditsyContainer: container
      })
    }

    container = await container
      .bindConstant(APP_STORE_ID, appStore)
      .bindConstant(APP_ALERTS_ID, Alert)
      .bindClass(SharedAppStateClient)
      .bindClass(DashboardManagerClient)
      .bindClass(ActionRegistry)
      .bindClass(WebActionManager)
      .bindClass(FileSystemManager)
      .bindClass(TrackManager)
      .bindClass(SessionManagerClient)
      .bindClass(AppSettingsClient)
      .bindClass(OverlayManagerClient)
      .bindClass(PluginManagerClient)
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
