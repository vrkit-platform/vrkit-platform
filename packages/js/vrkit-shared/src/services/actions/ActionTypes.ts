import { isNil, isString } from "@3fv/guard"
import { arrayOf, defaults, generateShortId } from '../../utils'
import { flatten } from "lodash"
import { ISharedAppState } from "../../models"

export type ActionManagerPromiseResolver<T = any, TResult1 = T> = (
  value: T
) => TResult1 | PromiseLike<TResult1>

export interface AcceleratorMap {
  [key: string]: string
}

export enum CommonKeys {
  MoveUp = "MoveUp",
  MoveDown = "MoveDown",
  MoveRight = "MoveRight",
  MoveLeft = "MoveLeft",
  MoveUpSelect = "MoveUpSelect",
  MoveDownSelect = "MoveDownSelect",
  New = "New",
  Edit = "Edit",
  Escape = "Escape",
  Enter = "Enter",
  Delete = "Delete",
  Backspace = "Backspace",
  Space = "Space",
  Find = "Find"
}

export const GlobalKeys = {
  [CommonKeys.New]: "super+n",
  [CommonKeys.Edit]: "super+e",
  [CommonKeys.MoveUp]: "ArrowUp",
  [CommonKeys.MoveDown]: "ArrowDown",
  [CommonKeys.MoveLeft]: "ArrowLeft",
  [CommonKeys.MoveRight]: "ArrowRight",
  [CommonKeys.MoveUpSelect]: "Shift+ArrowUp",
  [CommonKeys.MoveDownSelect]: "Shift+ArrowDown",
  [CommonKeys.Enter]: "Enter",
  [CommonKeys.Escape]: "Escape",
  [CommonKeys.Find]: "Super+F",
  [CommonKeys.Space]: "Space",
  [CommonKeys.Delete]: "Delete",
  [CommonKeys.Backspace]: "Backspace"
}

export function isCommonKey(
  accelerator: ActionDefaultAccelerator | ActionDefaultAccelerator[],
  commonKey: CommonKeys
): boolean {
  accelerator = arrayOf(accelerator)
  return accelerator.some(accel =>
    [commonKey, GlobalKeys[commonKey]].includes(accel)
  )
}

export type ActionDefaultAccelerator = string | CommonKeys

export enum ActionRuntime {
  main = "main",
  web = "web",
  any = "any",
  all = "all"
}

export type ActionRuntimeKind = ActionRuntime | `${ActionRuntime}`

/**
 * ALl command types
 */
export enum ActionType {
  /**
   * Registers a global shortcut in electron apps
   */
  Global = "Global",

  /**
   * App-Wide (Available in Main, Renderer, ...)
   */
  App = "App",

  /**
   * Loaded when a specific view is visible
   *
   * @type {ActionType.View}
   */
  View = "View",

  /**
   * Container or selector based
   */
  Container = "Container"
}

export type ActionTypeKind = ActionType | `${ActionType}`

export type ActionContainerElement = HTMLElement
// | React.ReactInstance
// | React.ReactNode

/**
 * Executor shape
 */
export type ActionExecutor<Args extends any[] = any> = (...args: Args) => any

/**
 * Used to enable/disable dynamically based on state
 *
 * TODO: Implement the app side of this
 */
export type ActionPredicate = (state: ISharedAppState) => boolean

/**
 * Default Implementation of Action, any things that fits the shape can be used
 */
export class Action implements ActionOptions {
  id: string

  /**
   * Electron/OS level menu item role
   */
  role?: ActionMenuItemDesktopRoleKind

  container?: ActionContainerElement
  containerId?: string

  runtime: ActionRuntimeKind

  /**
   * Current assigned accelerators
   */
  accelerators: ActionDefaultAccelerator[]

  /**
   * Default accelerators
   */
  defaultAccelerators: ActionDefaultAccelerator[]

  /**
   * Takes precendence of `<input>` components
   */
  overrideInput: boolean = false

  /**
   * Hidden in UI
   */
  hidden: boolean = false

  /**
   * Can not be remapped
   */
  disableKeyReassign: boolean

  /**
   * Create a command from a command object - anything that implements the
   * interface
   *
   * @param options
   */
  constructor(options: ActionOptions)

  /**
   * Create a command with required values
   *
   * @param id
   * @param type
   * @param execute
   * @param name
   * @param description
   * @param options
   */
  constructor(
    id: string,
    type: ActionTypeKind,
    execute: ActionExecutor,
    name?: string,
    description?: string,
    options?: ActionOptions
  )
  constructor(
    idOrAction: string | ActionOptions = null,
    readonly type: ActionTypeKind = null,
    readonly execute: ActionExecutor = null,
    readonly name: string = null,
    readonly description: string = null,
    readonly options: ActionOptions = {}
  ) {
    if (idOrAction) {
      if (isString(idOrAction)) {
        this.id = idOrAction
      } else {
        options = {
          ...options,
          ...idOrAction
        }
        // Object.assign(this, options)
      }
    }

    Object.assign(this, {
      ...options,
      disableKeyReassign: !isNil(this.disableKeyReassign)
        ? this.disableKeyReassign
        : !!this.hidden,

      accelerators: arrayOf(options.accelerators ?? options.defaultAccelerators)
    })

    defaults<Action>(this, {
      runtime: "any"
    })
  }
}

/**
 * Action menu item type
 */
export enum ActionMenuItemType {
  menu = "menu",
  action = "action",
  separator = "separator",
  checkbox = "checkbox"
}

/**
 * Font Icon config
 */
export interface ActionFontIcon {
  iconSet: string
  iconName: string
}

/**
 * Image Icon config
 */
export interface ActionImageIcon {
  url: string
}

/**
 * Icon type
 */
export type ActionIcon = string | ActionFontIcon | ActionImageIcon

/**
 * Check for font icon
 *
 * @param o
 */
export function ActionFontIcon(o: any): o is ActionFontIcon {
  return ["iconSet", "iconName"].every(p => o?.[p])
}

/**
 * Is image icon
 *
 * @param o
 * @returns {any}
 */
export function isActionImageIcon(o: any): o is ActionImageIcon {
  return ["url"].every(p => o?.[p])
}

/**
 * Tuple used to quickly define ActionOptions
 */
export type ActionOptionsTuple = [
  name: string,
  execute: () => any,
  accelerators?: string[],
  extraOptions?: ActionOptions
]

export function actionOptionsWithTuple(
  ...args: any[]
) {
  const tuples:Array<ActionOptionsTuple> = flatten(args)
    //   [0])
    // ? args as ActionOptionsTuple[]
    // : (args as ActionOptionsTuple[][])

  return tuples.map(([name, execute, accelerators = [], extraOptions = {} as any]) => ({
    id: extraOptions?.id ?? generateShortId(),
    name,
    execute,
    defaultAccelerators: accelerators,
    ...extraOptions
  } as ActionOptions))
}

export interface ActionDef extends Omit<ActionOptions, "container" | "execute"> {
  id: NonNullable<string>
  type: NonNullable<ActionTypeKind>
  name: NonNullable<string>
}

/**
 * Action options, used to defined
 * an action.
 */
export interface ActionOptions {
  /**
   * Unique identifier for command
   */
  id?: string

  /**
   * Global, App or Regular command
   */
  type?: ActionTypeKind

  /**
   * Electron/OS level menu item role
   */
  role?: ActionMenuItemDesktopRoleKind

  runtime?: ActionRuntimeKind

  /**
   * HTML Element (usually mapped through react ref)
   */
  container?: ActionContainerElement

  /**
   * HTML id attribute value of the container
   */
  containerId?: string
  
  
  predicate?: ActionPredicate
  
  /**
   * Execute the command, takes no args aside from the command
   *
   * @param command
   */
  execute?: ActionExecutor

  /**
   * Holder for electron accel
   */
  electronAccelerators?: string[]

  /**
   * Electron styled accelerator (converted to mousetrap in browser window)
   *
   * if false, an accelerator can not be assigned
   *
   * @see https://github.com/electron/electron/blob/master/docs/api/accelerator.md
   */
  defaultAccelerators?: ActionDefaultAccelerator[]

  /**
   * Accelerator currently configured
   */
  accelerators?: ActionDefaultAccelerator[]

  /**
   * If the command does not have a modifier and an input/select/textarea
   * has focus, unless overrideInput is true, the command is not triggered
   */
  overrideInput?: boolean

  /**
   * The visible name or label
   */
  name?: string

  /**
   * Optional extended info
   */
  description?: string

  /**
   * if not specified - assumes should show
   */
  hidden?: boolean

  /**
   * Hide in allActions result
   */
  hideInAllActions?: boolean

  /**
   * Current action is enabled
   */
  enabled?: boolean

  /**
   * if hidden disabled is assumed, but this prop
   * overrides all
   */
  disableKeyReassign?: boolean

  debugLabel?: string
}

export enum ActionMenuItemDesktopRole {
  undo = "undo",
  redo = "redo",
  cut = "cut",
  copy = "copy",
  paste = "paste",
  pasteAndMatchStyle = "pasteAndMatchStyle",
  delete = "delete",
  selectAll = "selectAll",
  reload = "reload",
  forceReload = "forceReload",
  toggleDevTools = "toggleDevTools",
  resetZoom = "resetZoom",
  zoomIn = "zoomIn",
  zoomOut = "zoomOut",
  toggleSpellChecker = "toggleSpellChecker",
  togglefullscreen = "togglefullscreen",
  window = "window",
  minimize = "minimize",
  close = "close",
  help = "help",
  about = "about",
  services = "services",
  hide = "hide",
  hideOthers = "hideOthers",
  unhide = "unhide",
  quit = "quit",
  startSpeaking = "startSpeaking",
  stopSpeaking = "stopSpeaking",
  zoom = "zoom",
  front = "front",
  appMenu = "appMenu",
  fileMenu = "fileMenu",
  editMenu = "editMenu",
  viewMenu = "viewMenu",
  shareMenu = "shareMenu",
  recentDocuments = "recentDocuments",
  toggleTabBar = "toggleTabBar",
  selectNextTab = "selectNextTab",
  selectPreviousTab = "selectPreviousTab",
  mergeAllWindows = "mergeAllWindows",
  clearRecentDocuments = "clearRecentDocuments",
  moveTabToNewWindow = "moveTabToNewWindow",
  windowMenu = "windowMenu"
}

export type ActionMenuItemDesktopRoleKind =
  | ActionMenuItemDesktopRole
  | `${ActionMenuItemDesktopRole}`

// export type ActionMenuItemDesktopRoleId = `electron${Capitalize<ActionMenuItemDesktopRole>}`
export type ActionMenuItemDesktopRoleId = ActionMenuItemDesktopRoleKind

/**
 * Executor shape
 */
export type ActionMenuItemExecutor = (item: ActionMenuItem, event?: any) => any

/**
 * Command menu item
 */
export interface ActionMenuItem {
  /**
   * Menu item id
   */
  id?: string

  containerId?: string

  accelerator?: string

  icon?: ActionIcon

  commandType?: ActionTypeKind
  menuItemType?: ActionMenuItemType

  subItems?: ActionMenuItem[]

  commandId?: string

  mountsWithContainer?: boolean

  role?: ActionMenuItemDesktopRole

  label?: string

  subLabel?: string

  enabled?: boolean

  hidden?: boolean

  menuPath?: string[]

  execute?: ActionMenuItemExecutor
}

export type ActionContainerFocusDetails = [
  string,
  HTMLElement,
  number,
  boolean,
  number
]

export interface ActionAutoFocus {
  enabled: boolean
  priority: number
}

export interface ActionAutoFocusOptions {
  autoFocus: ActionAutoFocus
  tabIndex: number
}

export const ActionAutoFocusOptionDefaults = {
  tabIndex: 0,
  autoFocus: {
    enabled: false,
    priority: 10
  }
} as ActionAutoFocusOptions

/**
 *
 * @param priority - higher priority = more likely to gain focus
 */
export function actionAutoFocus(priority: number = 1): ActionAutoFocus {
  return {
    enabled: true,
    priority
  }
}

export interface ActionsWithMenuItems {
  actions: ActionOptions[]
  menuItems: ActionMenuItem[]
}

// export type ActionItemOptions = [
//   ActionDefaultAccelerator,
//   ActionExecutor,
//   Partial<ActionOptions> | undefined
// ]

// export class ActionItemContainer {
//   constructor(
//     public id: string,
//     public commands: ActionOptions[] = [],
//     public menuItems: ActionOptions[] = []
//   ) {}
// }
//
// /**
//  * Action container registration
//  */
// export interface IActionContainerRegistration {
//   id: string
//   container: ActionContainerElement
//   element?: ActionContainerElement
//   available: boolean
//   options: ActionAutoFocusOptions
//   focused: boolean
//   items?: ActionItemContainer[]
//   unregisterItems?: UnregisterItemsCallback
//   // commands?: ActionOptions[]
//   // menuItems?: ActionMenuItem[]
//   observer: MutationObserver
// }
//
// /**
//  * Action accelerator data source
//  *
//  * used for providing accelerator overrides
//  */
// export interface IActionAcceleratorDataSource {
//   (): Record<string, string>
// }

/**
 * Key interceptor used for things like capturing custom accelerators
 *
 * if a key interceptor returns boolean(false) then the event is not consumed
 * by the command manager
 */
export type ActionKeyInterceptor = (event: KeyboardEvent) => any

/**
 * Action managed events
 */
export enum ActionManagerEvent {
  FocusChanged = "FocusChanged",
  KeyDown = "KeyDown",
  ActionsChanged = "ActionsChanged",
  ContainersChanged = "ContainersChanged"
}

/**
 * Globally available function type for getting
 * the window id
 */
export type ActionManagerWindowId = number | (() => number)

// export function childActionId(
//   containerId: string,
//   childId: string,
//   cmd: ActionOptions
// ): string {
//   return `${containerId}-${childId}-${cmd.name}`
// }

// export function childMenuItemId(
//   containerId: string,
//   childId: string,
//   item: ActionMenuItem
// ): string {
//   return `${containerId}-${childId}-${item.id ?? item.label ?? item.commandId}`
// }
