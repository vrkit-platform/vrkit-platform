import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { setServiceContainer } from "../../ServiceContainer"
import { NativeThemeManager } from "../../services/native-theme"
import {
  ElectronMainMenuManager,
  ElectronMenuRenderer
} from "../../services/electron-menu"
import { ActionRegistry } from "vrkit-shared"
import { AppSettingsService } from "../../services/app-settings"
import ElectronMainActionManager from "../../services/electron-actions"
import { once } from "vrkit-shared"
import { MainWindowManager, WindowManager } from "../../services/window-manager"
import SessionManager from "../../services/session-manager"
import { OverlayManager } from "../../services/overlay-manager"
import SharedAppState, { createSharedAppStateStore } from "../../services/store"
import { DashboardManager } from "../../services/dashboard-manager"
import { isDefined, isPromise } from "@3fv/guard"
import { asOption, Option } from "@3fv/prelude-ts"

const log = getLogger(__filename)

const createServiceContainer = once(async function createServiceContainer() {
  const container = await new Container()
    .bindClass(ActionRegistry)
    .bindClass(ElectronMainActionManager)
    .bindClass(NativeThemeManager)
    //.bindClass(ElectronMenuRenderer)
    .bindClass(AppSettingsService)
    //.bindClass(ElectronMainMenuManager)
    .bindClass(WindowManager)
    .bindClass(MainWindowManager)
    .bindClass(SessionManager)
    .bindClass(DashboardManager)
    .bindClass(OverlayManager)
    .bindAsyncFactory(SharedAppState, createSharedAppStateStore)
    .resolveAll()

  setServiceContainer(container)
  if (import.meta.webpackHot) {
    import.meta.webpackHot.dispose(() => {
      setServiceContainer(null)

      const keys = [...container.allKeys]
      const services = keys
        .map(key =>
          Option.try(() => container.get(key))
            .map(service => [key, service])
            .getOrNull()
        )
        .filter(isDefined)

      return Promise.all(
        services.map(([key, service]) => {
          const disposeFn: Function = service[Symbol.dispose] ?? service["unload"]
          if (disposeFn) {
            log.info(`Invoking dispose (key=${key})`)
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
