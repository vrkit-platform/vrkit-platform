import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { Bind, LazyGetter } from "vrkit-app-common/decorators"
import {
  Action,
  ActionDefaultAccelerator,
  ActionMenuItemDesktopRole,
  ActionMenuItemDesktopRoleKind,
  ActionOptions,
  ActionRegistry,
  ActionType,
  ElectronMainAppActions,
  electronRoleToId
} from "vrkit-app-common/services"
import { app, globalShortcut, IpcMainInvokeEvent } from "electron"
import { flatten, partition } from "lodash"
import {
  isDev, ZoomFactorIncrement, ZoomFactorMax, ZoomFactorMin
} from "../../constants"

import { assert, isPromise } from "@3fv/guard"
import { get } from "lodash/fp"
import { getSharedAppStateStore } from "../store"
import { IDisposer } from "mobx-utils"
import { isNotEmpty, removeIfMutation } from "../../../common/utils"
import Accelerator = Electron.Accelerator

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
      const store = getSharedAppStateStore()
      store.setShutdownInProgress()
      app.quit()
    }
  },
  {
    ...ElectronMainAppActions.zoomDefault,
    execute: () => {
      const store = getSharedAppStateStore()
      // store.setZoomFactor(1)
      store.updateAppSettings({zoomFactor:1})
    }
  },
  {
    ...ElectronMainAppActions.zoomIn,
    execute: () => {
      const store = getSharedAppStateStore(),
        newZoomFactor = store.appSettings.zoomFactor + ZoomFactorIncrement

      store.updateAppSettings({zoomFactor:Math.min(newZoomFactor, ZoomFactorMax)})
    }
  },
  {
    ...ElectronMainAppActions.zoomOut,
    execute: () => {
      const store = getSharedAppStateStore(),
        newZoomFactor = store.appSettings.zoomFactor - ZoomFactorIncrement
      
      store.updateAppSettings({zoomFactor:Math.max(newZoomFactor, ZoomFactorMin)})
      // store.setZoomFactor(Math.max(newZoomFactor, ZoomFactorMin))
    }
  }
]

@Singleton()
export class ElectronMainActionManager {
  
  private readonly enabledGlobalActionIds = Array<string>()
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
    // ipcMain.handle(ElectronIPCChannel.invokeMainAction, this.onInvokeMainAction)
    //
    // if (import.meta.webpackHot) {
    //   import.meta.webpackHot.addDisposeHandler(() => {
    //     actionRegistry.removeAll(...actions.map(get("id")))
    //     ipcMain.removeHandler(ElectronIPCChannel.invokeMainAction)
    //   })
    // }
  }

  constructor(
    readonly actionRegistry: ActionRegistry
  ) {}
  
  registerGlobalActions(...actions: Action[]) {
    actions.forEach(action => {
      this.actionRegistry.register(action.id, {...action, type: ActionType.Global})
    })
  }
  
  unregisterGlobalActions(...actions: Action[]) {
    this.actionRegistry.removeAll(...actions.map(get("id")))
  }
  
  enableGlobalActions(...ids: string[]): IDisposer {
    const
        reg = this.actionRegistry,
        actions = reg.globalActions.filter(it => ids.includes(it.id)),
        [enableActions, ignoredActions] = partition(actions, it => !this.enabledGlobalActionIds.includes(it.id)),
        enableActionIds = enableActions.map(get("id")),
        enabledAccelerators = Array<Accelerator>()
        
    if (isNotEmpty(ignoredActions))
      log.warn("Already active actions", ignoredActions)
    
    enableActions.forEach(action => {
      const [accels, registeredAccels] = partition(action.accelerators, accel => !globalShortcut.isRegistered(accel))
      
      if (registeredAccels.length)
        log.info(`Already assigned shortcuts`, registeredAccels)
      
      enabledAccelerators.push(...accels)
      globalShortcut.registerAll(accels, () => action.execute())
    })
    
    const disposer = () => {
      enabledAccelerators.forEach(accel => {
        globalShortcut.unregister(accel)
      })
      
      removeIfMutation(this.enabledGlobalActionIds, id => enableActionIds.includes(id))
    }
    
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        disposer()
      })
    }
    
    return disposer
  }
}

export default ElectronMainActionManager
