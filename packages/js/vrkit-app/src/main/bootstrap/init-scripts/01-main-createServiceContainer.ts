import { Container } from "@3fv/ditsy"

import { setServiceContainer } from "../../ServiceContainer"
import { NativeThemeManager } from "../../services/native-theme"
import { createMainStateStore, MainAppState } from "../../services/store"
import {
  ElectronMainMenuManager,
  ElectronMenuRenderer
} from "../../services/electron-menu"
import { ActionRegistry } from "vrkit-app-common/services/actions"
import { AppSettingsService } from "../../services/app-settings"
import ElectronActions from "../../services/electron-actions"
import { once } from "vrkit-app-common/utils"
import { WindowManager } from "../../services/window-manager"
import SessionManager from "../../services/session-manager"

const createServiceContainer = once(async function createServiceContainer() {
  const container = await new Container()
    .bindClass(ActionRegistry)
    .bindClass(ElectronActions)
    .bindClass(NativeThemeManager)
    .bindClass(ElectronMenuRenderer)
    .bindClass(AppSettingsService)
    .bindClass(ElectronMainMenuManager)
    .bindClass(WindowManager)
    .bindClass(SessionManager)
    .bindAsyncFactory(MainAppState, createMainStateStore)
    .resolveAll()

  setServiceContainer(container)

  return container
})

export default createServiceContainer
