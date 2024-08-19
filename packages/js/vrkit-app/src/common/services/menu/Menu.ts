import { asOption, Option } from "@3fv/prelude-ts"
import {
  assert,
  cloneDeep,
  cloneShallow,
  generateId,
  invokeWith,
  isNotEmpty,
  throwError,
  toNonEmptyString
} from "vrkit-app-common/utils"
import { P, match } from "ts-pattern"
import { isArray, isFunction, isObject } from "@3fv/guard"
import { MenuItem, MenuRenderer } from "./MenuTypes"
import { get } from "lodash/fp"
import { Action, ActionAccelerator, ActionOptions } from "vrkit-app-common/services"
import { assign, first } from "lodash"

import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

function serializeSubmenus(item: MenuItem) {
  const { submenu } = item
  return submenu instanceof Menu && !isArray(submenu)
    ? { ...item, submenu: submenu.getItems().map(serializeSubmenus) }
    : item
}

// DEBUG OVERRIDE
//log.setOverrideLevel(Level.DEBUG)

export class Menu<T = any> {
  /**
   * Create a new menu
   *
   * @return {Menu<any>}
   */
  static create() {
    return new Menu()
  }

  /**
   * Create a menu with a set of options
   *
   * @param {MenuRenderer<R>} renderer
   * @param {Array<T>} options
   * @param {keyof T} labelProp
   * @param {(opt?: T) => any} onSelect
   * @return {Menu<R>}
   */
  static createWithOptions<T extends object = any, R = any>(
    renderer: MenuRenderer<R>,
    options: Array<T> = [],
    labelProp: keyof T,
    onSelect: (opt?: T) => any = () => {}
  ) {
    const menu = new Menu([], renderer)

    options.forEach(opt => {
      const label = get(labelProp)(opt)
      menu.add({
        type: "normal",
        label,
        click: () => onSelect(opt)
      })
    })

    return menu
  }

  constructor(
    readonly items: Array<MenuItem> = [],
    public renderer: MenuRenderer<T> = undefined
  ) {}

  render(): T {
    return this.renderer?.render?.(this.items)
  }

  private ensureKeys(items: MenuItem[]) {
    return items.map(item => {
      return cloneShallow(item, {
        id: item.id ?? generateId()
      })
    })
  }

  /**
   * Get the underlying menu
   *
   * @returns {MenuItem[]}
   */
  getItems() {
    return [...this.ensureKeys(this.items)].map(serializeSubmenus)
  }

  /**
   * Add a simple label
   *
   * @param label
   * @returns {Menu}
   */
  addLabel(label: string) {
    const item = (this.items[this.items.length] = { type: "normal", label })

    return this
  }

  /**
   * Add a checkbox
   *
   * @param label
   * @param checked
   * @param icon
   * @param click
   */
  addCheckbox(
    label: string,
    checked: boolean,
    icon: string | any | (() => any),
    click: () => any
  ): this

  /**
   * Add a checkbox
   *
   * @param label
   * @param checked
   * @param execute
   */
  addCheckbox(label: string, checked: boolean, execute: () => any): this
  addCheckbox(
    label: string,
    checked: boolean,
    icon: string | any | (() => any),
    execute: () => any = null
  ): this {
    if (isFunction(icon) && !execute) {
      execute = icon
      icon = null as undefined
    } else if (!!icon) {
    } else {
      throw Error(`No execute function provided to addCheckbox`)
    }

    this.items.push({
      label,
      checked,
      type: "checkbox",
      click: execute,
      icon
    })

    return this
  }

  /**
   * Add a submenu
   *
   * @param label
   * @returns {Menu}
   */
  addSubmenu(label: string) {
    const submenu = new Menu<T>()

    this.items[this.items.length] = {
      type: "submenu",
      label,
      submenu
    }

    return submenu
  }

  add(item: MenuItem) {
    this.items.push(item)

    return this
  }

  /**
   * Add a command
   *
   * @param action
   * @param execute
   * @returns {Menu}
   */
  addAction(
    action: string,
    execute: () => any,
    options?: Partial<ActionOptions>
  ): this
  addAction(
    action: Action | ActionOptions,
    execute?: (() => any) | Partial<ActionOptions>,
    options?: Partial<ActionOptions>
  ): this
  addAction(
    action: Action | ActionOptions,
    options?: Partial<ActionOptions>
  ): this
  addAction(
    actionArg: Action | ActionOptions | string,
    executeOrOptionsArg: (() => any) | Partial<ActionOptions> = {},
    moreOptionsArg: Partial<ActionOptions> = {}
  ): this {
    // DEDUCE ARGS
    const executeArg = isFunction(executeOrOptionsArg)
        ? executeOrOptionsArg
        : null,
      optionsArg: Partial<ActionOptions> = {
        ...(isObject(executeOrOptionsArg) ? executeOrOptionsArg : {}),
        ...(isObject(moreOptionsArg) ? moreOptionsArg : {})
      }

    // DEDUCE ACTION
    const action = invokeWith(
      // DEDUCE ACTION VALUE
      match(actionArg)
        .with(P.nullish, () => {
          throwError(`undefined action`)
        })
        .with(
          P.string,
          action =>
            ({
              id: action,
              name: action,
              execute: executeArg,
              description: action,
              defaultAccelerators: null
            } as ActionOptions)
        )
        .otherwise(
          (action: ActionOptions | Action) =>
            cloneDeep(action, {
              execute: executeArg ?? action.execute
            }) as ActionOptions
        ),

      // AFTER BUILDING ACTION, ASSIGN ADDITIONAL PROPS
      action => assign(action, optionsArg)
    )

    // UNPACK
    const { id, name, description, execute, defaultAccelerators } = action,
      accel = first(defaultAccelerators)

    // DOUBLE CHECK
    assert(isFunction(execute), `No execute found for ${name}`)

    // APPEND
    this.items[this.items.length] = {
      id,
      label: toNonEmptyString(description, name),
      type: "normal",
      click: execute,
      accelerator: ActionAccelerator.toElectron(accel)
    }

    return this
  }

  /**
   * Add a separator
   *
   * @returns {Menu}
   */
  addSeparator() {
    this.items.push({ type: "separator" })

    return this
  }

  findItemById(id: string): MenuItem {
    return recursiveFindItem(id, this.items)
  }
}

/**
 * Recursively search for item with id, return on first match
 *
 * @param id
 * @param items
 */
function recursiveFindItem(id: string, items: MenuItem[]): MenuItem {
  for (const item of items) {
    if (item.id === id) {
      return item
    }

    if (item.submenu) {
      const res = recursiveFindItem(
        id,
        isArray(item.submenu) ? item.submenu : item.submenu?.items ?? []
      )
      if (!!res) {
        return res
      }
    }
  }

  return null
}
