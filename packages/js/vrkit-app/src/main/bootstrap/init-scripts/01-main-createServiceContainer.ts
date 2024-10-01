import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { setServiceContainer } from "../../ServiceContainer"
import { NativeThemeManager } from "../../services/native-theme"
import {
  ElectronMainMenuManager, ElectronMenuRenderer
} from "../../services/electron-menu"
import { ActionRegistry } from "vrkit-app-common/services/actions"
import { AppSettingsService } from "../../services/app-settings"
import ElectronActions from "../../services/electron-actions"
import { once } from "vrkit-app-common/utils"
import { MainWindowManager, WindowManager } from "../../services/window-manager"
import SessionManager from "../../services/session-manager"
import { OverlayManager } from "../../services/overlay-manager"
import SharedAppState, { createSharedAppStateStore } from "../../services/store"
import { DashboardManager } from "../../services/dashboard-manager"
import { isDefined, isPromise } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)

const createServiceContainer = once(async function createServiceContainer() {
  const container = await new Container()
      .bindClass(ActionRegistry)
      .bindClass(ElectronActions)
      .bindClass(NativeThemeManager)
      .bindClass(ElectronMenuRenderer)
      .bindClass(AppSettingsService)
      // .bindClass(ElectronMainMenuManager)
      .bindClass(WindowManager)
      .bindClass(MainWindowManager)
      .bindClass(SessionManager)
      .bindClass(DashboardManager)
      .bindClass(OverlayManager)
      .bindAsyncFactory(SharedAppState, createSharedAppStateStore)
      .resolveAll()
  
  setServiceContainer(container)
  if (import.meta.webpackHot) import.meta.webpackHot.addDisposeHandler(async () => {
    setServiceContainer(null)
    
    const keys = container.allKeys
    const services = keys.map(key => asOption(container.get(key))
        .map(service => [key, service])
        .getOrNull()).filter(isDefined)
    
    await Promise.all(services
        .map(([key, service]) => {
          const disposeFn:Function = service[Symbol.dispose] ??
              service["unload"]
          if (disposeFn) {
            log.info(`Invoking dispose (key=${key})`)
            const res = disposeFn.call(service)
            if (isPromise(res)) {
              return res
            } else {
              return Promise.resolve()
            }
          }
        }))
  })
  
  
  return container
})

export default createServiceContainer
