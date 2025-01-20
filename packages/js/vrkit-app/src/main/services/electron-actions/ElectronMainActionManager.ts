import { Container, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import {
  Action,
  ActionDef,
  ActionDefaultAccelerator,
  ActionMenuItemDesktopRole,
  ActionMenuItemDesktopRoleKind,
  ActionOptions,
  ActionRegistry,
  ActionsState,
  ActionType,
  AppActionId,
  Bind,
  defaults,
  Disposables,
  electronRoleToId,
  isNotEmpty,
  LazyGetter,
  removeIfMutation, WindowRole
} from "@vrkit-platform/shared"
import { app, BrowserWindow, globalShortcut, IpcMainInvokeEvent } from "electron"
import { flatten, omit, partition } from "lodash"
import { ZoomFactorIncrement, ZoomFactorMax, ZoomFactorMin } from "../../../common"
import { assert, isDefined, isPromise, isString } from "@3fv/guard"
import { get } from "lodash/fp"
import { getSharedAppStateStore, MainSharedAppState } from "../store"
import { IDisposer } from "mobx-utils"
import { ElectronMainAppActions } from "./ElectronMainAppActions"
import { ElectronMainGlobalActions } from "./ElectronMainGlobalActions"
import { runInAction, set } from "mobx"
import { editorExecuteAction } from "../overlay-manager/OverlayEditorActionFactory"
import { asOption } from "@3fv/prelude-ts"
import { getService } from "../../ServiceContainer"
import { AppSettingsService } from "../app-settings"
import Accelerator = Electron.Accelerator
import { WindowManager } from "../window-manager"

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
  [ActionMenuItemDesktopRole.quit, "Alt+F4"],
  ...(isDev &&
    ([
      [ActionMenuItemDesktopRole.reload, "CommandOrControl+r"],
      [ActionMenuItemDesktopRole.forceReload, "CommandOrControl+shift+r"],
      [ActionMenuItemDesktopRole.toggleDevTools, ["Control+j", "CommandOrControl+alt+i", "F12"]]
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
    execute: async () => {
      debug("Showing app settings / main")
      try {
        await getService(WindowManager)
          .create(WindowRole.Settings)
      } catch (err) {
        error(`Unable to open app settings`, err)
      }
      // TODO: Implement settings
      // getService(DesktopElectronWindowManager)?.openWindow(
      //   DesktopWindowType.settings
      // )
    }
  },
  {
    ...ElectronMainAppActions.closeWindow,
    role: "close",
    execute: () => {
      info(`close triggered - passing to window manager`)
      getService(WindowManager).closeRequest()
    }
  },
  {
    ...ElectronMainAppActions.quit,
    role: "quit",
    execute: (_menuItem: Electron.MenuItem) => {
      return ShutdownManager.shutdown()
    }
  },
  {
    ...ElectronMainAppActions.zoomDefault,
    execute: () => {
      getService(AppSettingsService).changeSettings({ zoomFactor: 1 })
    }
  },
  {
    ...ElectronMainAppActions.zoomIn,
    execute: () => {
      info("Zoom In")
      const store = getSharedAppStateStore(),
        newZoomFactor = store.appSettings.zoomFactor + ZoomFactorIncrement
      getService(AppSettingsService).changeSettings({
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

      getService(AppSettingsService).changeSettings({
        zoomFactor: Math.max(newZoomFactor, ZoomFactorMin)
      })
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

  get enabledAppActionIds() {
    return this.actionsState.enabledAppIds
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

  @Bind
  private updateActionsState() {
    runInAction(() => {
      const actionDefs: ActionDef[] = actionOptionsToActionDefs(this.actionRegistry.allActions)
      set(this.sharedAppState.actions, "actions", Object.fromEntries<ActionDef>(actionDefs.map(it => [it.id, it])))
    })
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

  @Bind
  private updateAppActions() {
    process.nextTick(() => {
      const wins = BrowserWindow.getAllWindows(),
        focused = wins.some(it => it.isFocused()),
        appActionIds = Object.keys(AppActionId)

      if (focused) {
        this.enableActions(ActionType.App, ...appActionIds)
      } else {
        this.disableActions(ActionType.App, ...appActionIds)
      }
    })
  }

  @PostConstruct()
  protected async init() {
    const { actions, actionRegistry } = this

    // ADD MAIN ACTIONS
    actionRegistry.addAll(...actions)

    // UPDATE THE STATE
    this.updateActionsState()

    actionRegistry.on("actionsChanged", this.onActionsChanged)

    // ADD HANDLER
    // ipcMain.handle(ElectronIPCChannel.invokeMainAction,
    // this.onInvokeMainAction)  if (import.meta.webpackHot) {
    // import.meta.webpackHot.addDisposeHandler(() => {
    // actionRegistry.removeAll(...actions.map(get("id")))
    // ipcMain.removeHandler(ElectronIPCChannel.invokeMainAction) }) }

    app.on("browser-window-blur", this.updateAppActions)
    app.on("browser-window-focus", this.updateAppActions)
    this.disposers_.push(() => {
      actionRegistry.off("actionsChanged", this.onActionsChanged)
      app.on("browser-window-blur", this.updateAppActions)
      app.on("browser-window-focus", this.updateAppActions)
    })

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.disposers_.dispose()
      })
    }
  }

  constructor(
    @InjectContainer()
    readonly container: Container,
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

  /**
   * Enables a set of actions specified by their IDs and assigns shortcuts, if
   * applicable, to make them active.
   *
   * @param {ActionType} type - The type of actions to enable, either global or
   *   application-specific.
   * @param {...string[]} ids - The identifiers of the actions to enable.
   * @return {string[]} An array of successfully enabled action IDs.
   */
  enableActions(type: ActionType, ...ids: string[]): string[] {
    return runInAction(() => {
      const reg = this.actionRegistry,
        typeActions = type === ActionType.Global ? reg.globalActions : reg.appActions,
        typeEnabledActionIds = type === ActionType.Global ? this.enabledGlobalActionIds : this.enabledAppActionIds,
        actions = typeActions.filter(it => ids.includes(it.id)),
        [enableActions, ignoredActions] = partition(actions, it => !typeEnabledActionIds.includes(it.id)),
        enableActionIds = enableActions.map(get("id")),
        enabledAccelerators = Array<Accelerator>()

      if (isNotEmpty(ignoredActions) && log.isDebugEnabled()) {
        log.debug("Already active actions", ignoredActions)
      }

      enableActions.forEach(action => {
        const accelerators = asOption(action.accelerators?.filter(isString))
          .filter(isNotEmpty)
          .orCall(() => asOption(action.defaultAccelerators?.filter(isString)))
          .filter(isNotEmpty)
          .getOrThrow(`No accelerators found for action id (${action.id})`)

        const [accels, registeredAccels] = partition(accelerators, accel => !globalShortcut.isRegistered(accel))

        if (registeredAccels.length) {
          log.debug(`Already assigned shortcuts`, registeredAccels)
        }

        enabledAccelerators.push(...accels)
        globalShortcut.registerAll(accels, () => action.execute())
        typeEnabledActionIds.push(action.id)
      })

      return enableActionIds
    })
  }

  @Bind
  enableGlobalActions(...ids: string[]): IDisposer {
    const enableActionIds = this.enableActions(ActionType.Global, ...ids)
    const disposer = () => {
      this.disableGlobalActions(enableActionIds)
    }

    this.disposers_.push(disposer)

    return disposer
  }

  @Bind
  disableActions(type: ActionType, ...actionIdArgs: Array<string | string[]>): void {
    return runInAction(() => {
      const actionIds = flatten(actionIdArgs),
        enabledActionDefs = actionIds.map(id => this.actionsState.actions[id]).filter(isDefined<ActionDef>),
        enabledActionIds = type === ActionType.Global ? this.enabledGlobalActionIds : this.enabledAppActionIds

      enabledActionDefs.forEach(actionDef => {
        actionDef.accelerators.forEach(accel => {
          globalShortcut.unregister(accel)
        })
      })

      removeIfMutation(enabledActionIds, id => actionIds.includes(id))
    })
  }

  @Bind
  disableGlobalActions(...actionIdArgs: Array<string | string[]>): void {
    return this.disableActions(ActionType.Global, ...actionIdArgs)
  }
}

export default ElectronMainActionManager
