import {
  ActionContainerElement,
  ActionsWithMenuItems,
  ActionDefaultAccelerator,
  ActionExecutor,
  ActionIcon,
  ActionMenuItem,
  ActionMenuItemType,
  ActionOptions,
  ActionType,
  CommonKeys,
  GlobalKeys,
  isCommonKey
} from "@vrkit-platform/shared"
import { assert, getValue, isFunction, isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import { assign, first } from "lodash"
import { isHTMLElement, isInputElement } from "../../utils"
import { arrayOf, isNotEmpty } from "@vrkit-platform/shared"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

/**
 * Action builder
 */
export class ActionBuilder {

  static createAppAction(
    opts: ActionOptions
  ): ActionOptions
  static createAppAction(
    id: string,
    defaultAccelerators: ActionDefaultAccelerator | ActionDefaultAccelerator[],
    execute: ActionExecutor,
    opts?: ActionOptions
  ): ActionOptions
  static createAppAction(
    idOrOptions: string | ActionOptions,
    defaultAccelerators?: ActionDefaultAccelerator | ActionDefaultAccelerator[],
    execute?: ActionExecutor,
    opts: ActionOptions = {}
  ): ActionOptions {
    let result: ActionOptions
    if (isString(idOrOptions)) {
      const id = idOrOptions
      defaultAccelerators = arrayOf(defaultAccelerators)

      result = {
        id,
        type: ActionType.App,
        name: opts.name ?? id,
        execute,
        defaultAccelerators,
        ...opts
      } as ActionOptions
    } else {
      result = {... opts, type: ActionType.App}
    }
    assert(isNotEmpty(result.id) && isFunction(result.execute) && isFunction(result.name), "id, execute, name are all required")

    return result
  }

  static createContainerAction(
    container: ActionContainerElement,
    containerId: string,
    defaultAccelerators: ActionDefaultAccelerator | ActionDefaultAccelerator[],
    execute: ActionExecutor,
    opts: ActionOptions = {}
  ) {
    defaultAccelerators = arrayOf(defaultAccelerators)
    const accelId = asOption(first(defaultAccelerators))
        .filter(isString)
        .map(accel => CommonKeys[accel] ?? accel)
        .getOrNull(),
      id = asOption(opts?.id)
        .filter(isNotEmpty)
        .orElse(() => asOption(containerId).map(it => it + "-" + accelId))
        .getOrThrow()

    return {
      id,
      type: ActionType.Container,
      name: getValue(() => opts.name, "No name"),
      execute,
      defaultAccelerators,
      container,
      element: container,
      ...opts
    } as ActionOptions
  }

  private actions: ActionOptions[] = []

  private menuItems: ActionMenuItem[] = []

  private omitEscape = false

  /**
   * Create with a container
   *
   * @param container
   * @param containerId
   */
  constructor(
    readonly container: ActionContainerElement = null,
    readonly containerId: string | null = null
  ) {


    if (!!container) {
      if (!containerId && !!container) {
        this.containerId = containerId = asOption((container as any)?.id)
          .orElse(() =>
            asOption(container)
              .filter(isHTMLElement)
              .map(elem => elem.id ?? elem.getAttribute("id"))
          )
          .getOrNull()
      }

      this.actions = [
        ActionBuilder.createContainerAction(
          container,
          containerId,
          CommonKeys.Escape,
          () => {
            if (isInputElement(document.activeElement as HTMLElement)) {
              debug("Default blur", containerId, container)
              ;container?.blur?.()
            }
          },
          {
            id: "default-blur-focus",
            overrideInput: true
          }
        )
      ]
    }
  }

  /**
   * Push action to build queue
   *
   * @param {ActionOptions} newAction
   * @return {this}
   * @private
   */
  private pushAction(newAction: ActionOptions): this {
    if (
      newAction.defaultAccelerators.some(accel =>
        isCommonKey(accel, CommonKeys.Escape)
      )
    ) {
      log.debug("Overriding default escape")
      this.ignoreEscape(true)
    }

    this.actions = [
      ...this.actions.filter(cmd => {
        const allAccels = [
          ...cmd.accelerators,
          ...cmd.accelerators.map(accel => GlobalKeys[accel]).filter(isNotEmpty)
        ]
        return newAction.defaultAccelerators.some(accel =>
          allAccels.includes(accel)
        )
      }),
      newAction
    ]

    return this
  }

  /**
   * Ignore the escape key
   *
   * @param {boolean} omitEscape
   * @return {this}
   */
  ignoreEscape(omitEscape: boolean = true): this {
    this.omitEscape = omitEscape

    if (omitEscape) {
      this.actions = this.actions.filter(
        cmd => !isCommonKey(cmd.defaultAccelerators, CommonKeys.Escape)
      )
    }

    return this
  }

  useAction(
    actionOptions: ActionOptions,
    execute: ActionExecutor,
    opts: ActionOptions = {}
  ): this {
    assert(
      this instanceof ActionBuilder,
      "Must be an instance of ActionContainerBuilder"
    )
    assert(
      actionOptions && actionOptions.id && !actionOptions.execute,
      `Action must be valid with ID and execute must be null`
    )

    const action = assign({}, actionOptions, { execute }, opts) as ActionOptions

    return this.pushAction(action)
  }

  /**
   * Action factory function
   *
   * @param execute
   * @param opts
   * @param defaultAccelerators
   * @return {this}
   */
  appAction(
    id: string,
    defaultAccelerators: ActionDefaultAccelerator | ActionDefaultAccelerator[],
    execute: ActionExecutor,
    opts: ActionOptions = {}
  ) {
    assert(
      this instanceof ActionBuilder,
      "Must be an instance of ActionContainerBuilder"
    )

    const action = ActionBuilder.createAppAction(
      id,
      defaultAccelerators,
      execute,
      opts
    )

    return this.pushAction(action)
  }

  /**
   * Action factory function
   *
   * @param execute
   * @param opts
   * @param defaultAccelerators
   * @return {this}
   */
  containerAction(
    defaultAccelerators: ActionDefaultAccelerator | ActionDefaultAccelerator[],
    execute: ActionExecutor,
    opts: ActionOptions = {}
  ) {
    assert(
      this instanceof ActionBuilder,
      "Must be an instance of ActionContainerBuilder"
    )

    const action = ActionBuilder.createContainerAction(
      this.container,
      this.containerId,
      defaultAccelerators,
      execute,
      opts
    )

    return this.pushAction(action)
  }

  /**
   * Make menu item
   *
   * @param type
   * @param label
   * @param icon
   * @param opts
   */
  makeMenuItem(
    type: ActionMenuItemType,
    label: string,
    icon?: ActionIcon,
    opts?: ActionMenuItem
  ): ActionMenuItem
  /**
   * Make menu item
   *
   * @param id
   * @param commandId
   * @param icon
   * @param opts
   */
  makeMenuItem(
    id: string,
    commandId: string,
    icon?: ActionIcon,
    opts?: ActionMenuItem
  ): ActionMenuItem

  /**
   * Make menu item
   *
   * @param id
   * @param type
   * @param label
   * @param icon
   * @param opts
   */
  makeMenuItem(
    id: string,
    type: ActionMenuItemType,
    label: string,
    icon?: ActionIcon,
    opts?: ActionMenuItem
  ): ActionMenuItem
  makeMenuItem(...args: any[]) {
    let id: string,
      type: ActionMenuItemType,
      label: string,
      icon: ActionIcon,
      commandId: string,
      opts: ActionMenuItem

    if (Object.keys(ActionMenuItemType).includes(args[0])) {
      ;[type, label, icon, opts] = args
    } else if (isString(args[1])) {
      ;[id, commandId, icon, opts] = args
      type = ActionMenuItemType.action
    } else {
      ;[id, type, label, icon, opts] = args
    }

    opts = opts || {}
    let containerId: string = null
    if (!!this.container) {
      containerId = this.container?.id as string
    }

    id = asOption(id)
      .orElse(() => asOption(opts?.id))
      .orElse(() => asOption(containerId)
        .map(containerId => `${containerId}-${label}`))
      .getOrNull()

    return {
        id,
        menuItemType: type,
        commandId,
        containerId,
        label,
        icon,
        ...opts
      } as ActionMenuItem
  }

  /**
   * Create a menu item
   *
   * @param type
   * @param label
   * @param icon
   * @param opts
   */
  menuItem(
    type: ActionMenuItemType,
    label: string,
    icon?: ActionIcon,
    opts?: ActionMenuItem
  ):ActionMenuItem
  menuItem(
    id: string,
    commandId: string,
    icon?: ActionIcon,
    opts?: ActionMenuItem
  ):ActionMenuItem
  menuItem(
    id: string,
    type: ActionMenuItemType,
    label: string,
    icon?: ActionIcon,
    opts?: ActionMenuItem
  ):ActionMenuItem
  menuItem(...args: any[]) {
    this.menuItems.push((this.makeMenuItem as any)(...args))

    return this
  }

  /**
   * Make command container items
   */
  make(): ActionsWithMenuItems {
    return {
      actions: this.actions,
      menuItems: this.menuItems
    }
  }
}

export type ActionItemsCreator = (
  builder: ActionBuilder
) => ActionsWithMenuItems
