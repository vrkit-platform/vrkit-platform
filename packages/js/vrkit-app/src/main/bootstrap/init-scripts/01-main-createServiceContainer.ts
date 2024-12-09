import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { setServiceContainer } from "../../ServiceContainer"
import { NativeThemeManager } from "../../services/native-theme"

import { ActionRegistry, once } from "vrkit-shared"
import { AppSettingsService } from "../../services/app-settings"
import ElectronMainActionManager from "../../services/electron-actions"
import { MainWindowManager, WindowManager } from "../../services/window-manager"
import SessionManager from "../../services/session-manager"
import { OverlayManager } from "../../services/overlay-manager"
import SharedAppState, { createSharedAppStateStore } from "../../services/store"
import { DashboardManager } from "../../services/dashboard-manager"
import { isDefined, isFunction, isPromise, isString } from "@3fv/guard"
import { Option } from "@3fv/prelude-ts"
import { PluginManager } from "../../services/plugin-manager"
import OpenXRConfigurator from "../../services/openxr-configurator"
import { FileSystemManager } from "vrkit-shared/services/node"
import { ElectronMainMenuManager } from "../../services/electron-menu"

const log = getLogger(__filename)

const createServiceContainer = once(async function createServiceContainer() {
  const container = await new Container()
    .bindClass(OpenXRConfigurator)
    .bindClass(FileSystemManager)
    .bindClass(ActionRegistry)
    .bindClass(ElectronMainActionManager)
    .bindClass(NativeThemeManager)
    //.bindClass(ElectronMenuRenderer)
    .bindClass(AppSettingsService)
    .bindClass(ElectronMainMenuManager)
    .bindClass(WindowManager)
    .bindClass(MainWindowManager)
    .bindClass(SessionManager)
    .bindClass(DashboardManager)
    .bindClass(OverlayManager)
    .bindClass(PluginManager)
    .bindAsyncFactory(SharedAppState, createSharedAppStateStore)
    .resolveAll()

  setServiceContainer(container)
  if (import.meta.webpackHot) {
    import.meta.webpackHot.dispose(() => {
      setServiceContainer(null)

      const keys = [...container.allKeys],
          keyNames = keys.map(key => (isFunction(key) && isString(key.name)) ? key.name : isString(key) ? key : "N/A")
      
      const services = keys
        .map((key, idx) =>
          Option.try(() => container.get(key))
            .map(service => [key, service, keyNames[idx]])
            .getOrNull()
        )
        .filter(isDefined)

      return Promise.all(
        services.map(([key, service, keyName]) => {
          const disposeFn: Function = service[Symbol.dispose] ?? service["unload"]
          if (disposeFn) {
            log.info(`Invoking dispose (key=${keyName})`)
            const res = disposeFn.call(service)
            if (isPromise(res)) {
              return res
            } else {
              return Promise.resolve()
            }
          }
        })
      )
    })
  }
  return container
})

export default createServiceContainer
