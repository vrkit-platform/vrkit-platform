import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { Bind, LazyGetter } from "vrkit-app-common/decorators"
import {
  ActionDefaultAccelerator,
  ActionMenuItemDesktopRole,
  ActionMenuItemDesktopRoleKind,
  ActionOptions,
  ActionRegistry,
  ActionType,
  ElectronIPCChannel,
  ElectronMainAppActions,
  electronRoleToId
} from "vrkit-app-common/services"
import { app, ipcMain, IpcMainInvokeEvent } from "electron"
import { flatten } from "lodash"
import {
  isDev, ZoomFactorIncrement, ZoomFactorMax, ZoomFactorMin
} from "../../constants"
import { getMainStateStore } from "../store"
import { assert, isPromise } from "@3fv/guard"
import { get } from "lodash/fp"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

function electronMenuActionOptions(
  role: ActionMenuItemDesktopRoleKind,
  defaultAccelerator: string | string[],
  options: ActionOptions = {}
): ActionOptions {
  return {
    id: electronRoleToId(role),
    role: role as ActionMenuItemDesktopRole,
    type: ActionType.App,
    defaultAccelerators: flatten([defaultAccelerator]),
    ...options
  }
}

type ElectronRoleAcceleratorData = [
  ActionMenuItemDesktopRole,
  ActionDefaultAccelerator | ActionDefaultAccelerator[],
  ActionOptions?
]

const roleAccelerators = Array<ElectronRoleAcceleratorData>(
  [ActionMenuItemDesktopRole.undo, "CommandOrControl+z"],
  [ActionMenuItemDesktopRole.redo, "CommandOrControl+shift+z"],
  [ActionMenuItemDesktopRole.cut, "CommandOrControl+x"],
  [ActionMenuItemDesktopRole.copy, "CommandOrControl+c"],
  [ActionMenuItemDesktopRole.paste, "CommandOrControl+v"],
  [ActionMenuItemDesktopRole.selectAll, "CommandOrControl+a"],
  // [ActionMenuItemDesktopRole.quit, "CommandOrControl+q"],
  ...(isDev &&
    ([
      [ActionMenuItemDesktopRole.reload, "CommandOrControl+r"],
      [ActionMenuItemDesktopRole.forceReload, "CommandOrControl+shift+r"],
      [
        ActionMenuItemDesktopRole.toggleDevTools,
        ["CommandOrControl+alt+i", "F12"]
      ]
    ] as ElectronRoleAcceleratorData[])),
  [ActionMenuItemDesktopRole.minimize, "CommandOrControl+m"],
  [ActionMenuItemDesktopRole.front, [], { name: "Bring All to Front" }]
)

export const electronMenuActions = roleAccelerators.map(
  ([role, accel, options = {}]) =>
    electronMenuActionOptions(role, accel, options)
)

/**
 * Global actions
 */
export const electronGlobalActions: Array<ActionOptions> = [
  {
    ...ElectronMainAppActions.gotoAppSettings,
    execute: () => {
      debug("Showing app settings / main")
      // TODO: Implement settings
      // getService(DesktopElectronWindowManager)?.openWindow(
      //   DesktopWindowType.settings
      // )
    }
  },
  // {
  //   ...ElectronMainAppActions.newWindow,
  //   execute: () => {
  //     getService(DesktopElectronWindowManager)?.openWindow(
  //       DesktopWindowType.normal
  //     )
  //   }
  // },
  {
    ...ElectronMainAppActions.closeWindow,
    role: "close",
    execute: (
      _menuItem: Electron.MenuItem,
      browserWindow: Electron.BrowserWindow,
      _event: Electron.KeyboardEvent
    ) => {
      browserWindow.close()
      // const manager = getService(DesktopElectronWindowManager)
      // manager.getWindowByBrowserWindow(browserWindow)?.close()
      // ?.openWindow(DesktopWindowType.normal)
    }
  },
  {
    ...ElectronMainAppActions.quit,
    execute: () => {
      const store = getMainStateStore()
      store.setShutdownInProgress()
      app.quit()
    }
  },
  {
    ...ElectronMainAppActions.zoomDefault,
    execute: () => {
      const store = getMainStateStore()
      store.setZoomFactor(1)
    }
  },
  {
    ...ElectronMainAppActions.zoomIn,
    execute: () => {
      const store = getMainStateStore(),
        newZoomFactor = store.zoomFactor + ZoomFactorIncrement

      store.setZoomFactor(Math.min(newZoomFactor, ZoomFactorMax))
    }
  },
  {
    ...ElectronMainAppActions.zoomOut,
    execute: () => {
      const store = getMainStateStore(),
        newZoomFactor = store.zoomFactor - ZoomFactorIncrement

      store.setZoomFactor(Math.max(newZoomFactor, ZoomFactorMin))
    }
  }
]

@Singleton()
export class ElectronMainActionManager {
  /**
   * Create electron actions
   *
   * @return {ActionOptions[]}
   * @private
   */
  @LazyGetter
  private get actions(): ActionOptions[] {
    return [...electronMenuActions, ...electronGlobalActions]
  }

  @Bind
  private async onInvokeMainAction(
    _event: IpcMainInvokeEvent,
    actionId: string
  ) {
    const action = this.actionRegistry.get(actionId)
    assert(!!action, `Unable to find action with id (${actionId})`)

    const result = action.execute()
    if (isPromise(result)) {
      await result
    }
  }

  @PostConstruct()
  private async init() {
    const { actions, actionRegistry } = this

    // ADD MAIN ACTIONS
    actionRegistry.addAll(...actions)

    // ADD HANDLER
    ipcMain.handle(ElectronIPCChannel.invokeMainAction, this.onInvokeMainAction)

    if (module.hot) {
      module.hot.addDisposeHandler(() => {
        actionRegistry.removeAll(...actions.map(get("id")))
        ipcMain.removeHandler(ElectronIPCChannel.invokeMainAction)
      })
    }
  }

  constructor(
    // readonly windowManager: DesktopElectronWindowManager,
    readonly actionRegistry: ActionRegistry
  ) {}
}

export default ElectronMainActionManager
