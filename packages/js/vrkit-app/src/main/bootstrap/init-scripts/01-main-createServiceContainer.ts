import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import {
  setServiceContainer, shutdownServiceContainer
} from "../../ServiceContainer"
import { NativeThemeManager } from "../../services/native-theme"
import { ActionRegistry, once } from "@vrkit-platform/shared"
import { AppSettingsService } from "../../services/app-settings"
import ElectronMainActionManager from "../../services/electron-actions"
import WindowManager from "../../services/window-manager"
import SessionManager from "../../services/session-manager"
import { OverlayManager } from "../../services/overlay-manager"
import SharedAppState, { createSharedAppStateStore } from "../../services/store"
import { DashboardManager } from "../../services/dashboard-manager"
import { PluginManager } from "../../services/plugin-manager"
import OpenXRConfigurator from "../../services/openxr-configurator"
import { FileSystemManager } from "@vrkit-platform/shared/services/node"
import { ElectronMainMenuManager } from "../../services/electron-menu"
import { SystemIntegrationManager } from "../../services/system-integration"

const log = getLogger(__filename)

const createServiceContainer = once(async function createServiceContainer() {
  const container = await new Container()
    .bindClass(OpenXRConfigurator)
    .bindClass(FileSystemManager)
    .bindClass(ActionRegistry)
    .bindClass(ElectronMainActionManager)
    .bindClass(NativeThemeManager)
    .bindClass(AppSettingsService)
    .bindClass(SystemIntegrationManager)
    .bindClass(ElectronMainMenuManager)
    .bindClass(WindowManager)
    .bindClass(SessionManager)
    .bindClass(DashboardManager)
    .bindClass(OverlayManager)
    .bindClass(PluginManager)
    .bindAsyncFactory(SharedAppState, createSharedAppStateStore)
    .resolveAll()

  setServiceContainer(container)
  if (import.meta.webpackHot) {
    import.meta.webpackHot.addDisposeHandler(() => {
      shutdownServiceContainer()
    })
  }
  return container
})

export default createServiceContainer
