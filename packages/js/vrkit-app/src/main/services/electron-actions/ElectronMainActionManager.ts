import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { Bind, LazyGetter } from "vrkit-shared"
import {
  Action,
  ActionDef,
  ActionDefaultAccelerator,
  ActionMenuItemDesktopRole,
  ActionMenuItemDesktopRoleKind,
  ActionOptions,
  ActionRegistry,
  ActionType,
  electronRoleToId
} from "vrkit-shared"
import { app, globalShortcut, IpcMainInvokeEvent } from "electron"
import { flatten, omit, partition } from "lodash"
import { isDev, ZoomFactorIncrement, ZoomFactorMax, ZoomFactorMin } from "../../constants"

import { assert, isDefined, isPromise, isString } from "@3fv/guard"
import { get } from "lodash/fp"
import { getSharedAppStateStore, MainSharedAppState } from "../store"
import { IDisposer } from "mobx-utils"
import { defaults, Disposables, isNotEmpty, removeIfMutation } from "vrkit-shared"
import { ElectronMainAppActions } from "./ElectronMainAppActions"
import { ElectronMainGlobalActions } from "./ElectronMainGlobalActions"
import { BindAction } from "../../decorators"
import { set } from "mobx"
import { ActionsState } from "vrkit-shared"
import { editorExecuteAction } from "../overlay-manager/OverlayEditorActionFactory"
import { asOption } from "@3fv/prelude-ts"
import Accelerator = Electron.Accelerator

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

function electronMenuActionOptions(
  role: ActionMenuItemDesktopRoleKind,
  defaultAccelerator: string | string[],
  options: ActionOptions = {}
): ActionDef {
  const id = electronRoleToId(role)
  return defaults(
    {
      id,
      role: role as ActionMenuItemDesktopRole,
      type: ActionType.App,
      defaultAccelerators: flatten([defaultAccelerator]),
      ...options
    },
    { name: id }
  ) as ActionDef
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
      [ActionMenuItemDesktopRole.toggleDevTools, ["CommandOrControl+alt+i", "F12"]]
    ] as ElectronRoleAcceleratorData[])),
  [ActionMenuItemDesktopRole.minimize, "CommandOrControl+m"],
  [ActionMenuItemDesktopRole.front, [], { name: "Bring All to Front" }]
)

export const electronMenuActions = roleAccelerators.map(([role, accel, options = {}]) =>
  electronMenuActionOptions(role, accel, options)
)

/**
 * Global actions
 */
export const electronGlobalActions: Array<ActionOptions> = [
  {
    ...ElectronMainGlobalActions.toggleOverlayEditor,
    execute: editorExecuteAction(([om, editor]) => {
      om.setEditorEnabled(!om.editorEnabled)
    })
  },
  {
    ...ElectronMainGlobalActions.switchOverlayVREditorInfoAnchor,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeNextVROverlayEditorInfoAnchor()
    })
  },
  {
    ...ElectronMainGlobalActions.switchOverlayScreenEditorInfoAnchor,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeNextScreenOverlayEditorInfoAnchor()
    })
  },
  {
    ...ElectronMainGlobalActions.switchOverlayFocusNext,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeSelectOverlay(1)
    })
  },
  {
    ...ElectronMainGlobalActions.switchOverlayFocusPrevious,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeSelectOverlay(-1)
    })
  },
  {
    ...ElectronMainGlobalActions.toggleOverlayPlacementProp,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeSelectNextOverlayProp()
    })
  },
  {
    ...ElectronMainGlobalActions.incrementOverlayPlacementProp,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeAdjustSelectedOverlayConfigProp(true)
    })
  },
  {
    ...ElectronMainGlobalActions.decrementOverlayPlacementProp,
    execute: editorExecuteAction(([om, editor]) => {
      editor.executeAdjustSelectedOverlayConfigProp(false)
    })
  }
]
/**
 * App actions
 */
export const electronAppActions: Array<ActionOptions> = [
  {
    ...ElectronMainAppActions.gotoAppSettings,
    execute: () => {
      debug("Showing app settings / main")
      // TODO: Implement settings
      // getService(DesktopElectronWindowManager)?.openWindow(
      //   DesktopWindowType.settings
      // )
    }
  }, // {
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
    execute: (_menuItem: Electron.MenuItem, browserWindow: Electron.BrowserWindow, _event: Electron.KeyboardEvent) => {
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
      store.updateAppSettings({ zoomFactor: 1 })
    }
  },
  {
    ...ElectronMainAppActions.zoomIn,
    execute: () => {
      info("Zoom In")
      const store = getSharedAppStateStore(),
        newZoomFactor = store.appSettings.zoomFactor + ZoomFactorIncrement

      store.updateAppSettings({
        zoomFactor: Math.min(newZoomFactor, ZoomFactorMax)
      })
    }
  },
  {
    ...ElectronMainAppActions.zoomOut,
    execute: () => {
      info("Zoom Out")
      const store = getSharedAppStateStore(),
        newZoomFactor = store.appSettings.zoomFactor - ZoomFactorIncrement

      store.updateAppSettings({
        zoomFactor: Math.max(newZoomFactor, ZoomFactorMin)
      })
      // store.setZoomFactor(Math.max(newZoomFactor, ZoomFactorMin))
    }
  }
]

function actionOptionsToActionDefs(actions: ActionOptions[]): Array<ActionDef> {
  return actions.map(it => omit(it, ["execute", "container"]) as ActionDef)
}

@Singleton()
export class ElectronMainActionManager {
  private readonly disposers_ = new Disposables()

  get actionsState(): ActionsState {
    return this.sharedAppState.actions
  }

  get enabledGlobalActionIds() {
    return this.actionsState.enabledGlobalIds
  }

  /**
   * Create electron actions
   *
   * @return {ActionDef[]}
   * @private
   */
  @LazyGetter
  private get actions(): ActionOptions[] {
    return [...electronMenuActions, ...electronAppActions, ...electronGlobalActions]
  }

  @LazyGetter
  private get actionDefs(): ActionDef[] {
    return actionOptionsToActionDefs(this.actions)
  }

  @Bind
  private async onInvokeMainAction(_event: IpcMainInvokeEvent, actionId: string) {
    const action = this.actionRegistry.get(actionId)
    assert(!!action, `Unable to find action with id (${actionId})`)

    const result = action.execute()
    if (isPromise(result)) {
      await result
    }
  }

  /**
   * On actions changed, update the shared app state
   *
   * @param actionMap
   * @private
   */
  @BindAction()
  private updateActionsState() {
    const actionDefs: ActionDef[] = actionOptionsToActionDefs(this.actionRegistry.allActions)
    set(this.sharedAppState.actions, "actions", Object.fromEntries<ActionDef>(actionDefs.map(it => [it.id, it])))
  }

  @Bind
  private onActionsChanged(actionMap: Map<string, Action>) {
    debug("onActionsChanged, updating state")
    this.updateActionsState()
  }

  [Symbol.dispose]() {
    this.disposers_.dispose()
  }

  private unload() {
    this[Symbol.dispose]()
  }

  @PostConstruct()
  private async init() {
    const { actions, actionRegistry } = this

    // ADD MAIN ACTIONS
    actionRegistry.addAll(...actions)

    // UPDATE THE STATE
    this.updateActionsState()

    actionRegistry.on("actionsChanged", this.onActionsChanged)
    this.disposers_.push(() => {
      actionRegistry.off("actionsChanged", this.onActionsChanged)
    })

    // ADD HANDLER
    // ipcMain.handle(ElectronIPCChannel.invokeMainAction,
    // this.onInvokeMainAction)  if (import.meta.webpackHot) {
    // import.meta.webpackHot.addDisposeHandler(() => {
    // actionRegistry.removeAll(...actions.map(get("id")))
    // ipcMain.removeHandler(ElectronIPCChannel.invokeMainAction) }) }

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.disposers_.dispose()
      })
    }
  }

  constructor(
    @InjectContainer() readonly container: Container,
    readonly actionRegistry: ActionRegistry,
    readonly sharedAppState: MainSharedAppState
  ) {}

  registerGlobalActions(...actions: Action[]) {
    actions.forEach(action => {
      this.actionRegistry.register(action.id, { ...action, type: ActionType.Global })
    })
  }

  unregisterGlobalActions(...actions: Action[]) {
    const actionIds = actions.map(get("id"))
    this.actionRegistry.removeAll(...actionIds)
    this.disableGlobalActions(...actionIds)
  }

  @BindAction() enableGlobalActions(...ids: string[]): IDisposer {
    const reg = this.actionRegistry,
      actions = reg.globalActions.filter(it => ids.includes(it.id)),
      [enableActions, ignoredActions] = partition(actions, it => !this.enabledGlobalActionIds.includes(it.id)),
      enableActionIds = enableActions.map(get("id")),
      enabledAccelerators = Array<Accelerator>()

    if (isNotEmpty(ignoredActions)) log.warn("Already active actions", ignoredActions)

    enableActions.forEach(action => {
      const accelerators = asOption(action.accelerators?.filter(isString))
        .filter(isNotEmpty)
        .orCall(() => asOption(action.defaultAccelerators?.filter(isString)))
        .filter(isNotEmpty)
        .getOrThrow(`No accelerators found for action id (${action.id})`)

      const [accels, registeredAccels] = partition(accelerators, accel => !globalShortcut.isRegistered(accel))

      if (registeredAccels.length) log.info(`Already assigned shortcuts`, registeredAccels)

      enabledAccelerators.push(...accels)
      globalShortcut.registerAll(accels, () => action.execute())
      this.enabledGlobalActionIds.push(action.id)
    })

    const disposer = () => {
      this.disableGlobalActions(enableActionIds)
    }

    this.disposers_.push(disposer)

    return disposer
  }

  @BindAction() disableGlobalActions(...enableActionIdArgs: Array<string | string[]>): void {
    const enableActionIds = flatten(enableActionIdArgs),
      enabledActionDefs = enableActionIds.map(id => this.actionsState.actions[id]).filter(isDefined<ActionDef>)

    enabledActionDefs.forEach(actionDef => {
      actionDef.accelerators.forEach(accel => {
        globalShortcut.unregister(accel)
      })
    })

    removeIfMutation(this.enabledGlobalActionIds, id => enableActionIds.includes(id))
  }
}

export default ElectronMainActionManager
