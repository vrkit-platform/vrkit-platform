import { getLogger } from "@3fv/logger-proxy"
import { Singleton } from "@3fv/ditsy"
import { Action, ActionOptions, ActionType } from "./ActionTypes"
import {
  devExposeGlobal,
  equalTo,
  isEqual,
  propEqualTo,
  removeFirstMutation
} from "vrkit-app-common/utils"
import { flatten } from "lodash"
import { assert, isObject, isString } from "@3fv/guard"
import { Bind, MemoizeGetter } from "vrkit-app-common/decorators"
import { asOption, Predicate } from "@3fv/prelude-ts"
import type { ActionContainer } from "./ActionContainer"
import EventEmitter3 from "eventemitter3"
import { get } from "lodash/fp"
import { AppActionId } from "./AppActionIds"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

function actionMatcher(match: Partial<Action>) {
  const criteria = Object.entries(match)
  return Predicate.of<Action>(action =>
    criteria.every(([key, value]) => isEqual(action[key], value))
  )
}

interface ActionRegistryEvents {
  appActionsChanged: (appActions: Map<string, Action>) => any
  containerAdded: (container: ActionContainer) => any
  containerRemoved: (container: ActionContainer) => any
  containersChanged: (containers: ActionContainer[]) => any
}

@Singleton()
export class ActionRegistry extends EventEmitter3<ActionRegistryEvents> {
  /**
   * All current containers
   */
  private readonly containers: ActionContainer[] = []

  /**
   * Shortcut to get container ids
   */
  get containerIds() {
    return this.containers.map(get("id"))
  }

  /**
   * Internal private state
   */
  private readonly state = {
    containerActions: Array<Action>(),
    allActions: Array<Action>()
  }

  private readonly appActions = new Map<string, Action>()

  get containerActions() {
    return this.state.containerActions
  }

  /**
   * Get all actions as a list
   *
   * @return {Action[]}
   * @private
   */

  get allActions() {
    return this.state.allActions
  }

  /**
   * Get a specific action
   *
   * @param {string} id
   * @return {Action}
   */
  @Bind
  get(id: string | AppActionId) {
    return this.appActions.get(id)
  }

  /**
   * Find the first action that
   * matches the criteria provided
   *
   * @param match
   * @return {null}
   */
  @Bind
  find(match: Partial<Action>): Action {
    const matcher = actionMatcher(match)
    for (const [, value] of this.appActions) {
      if (matcher(value)) {
        return value
      }
    }
    return null
  }

  /**
   * Find all matches
   *
   * @param match
   * @return {Action[]}
   */
  @Bind
  findAll(match: Partial<Action>): Action[] {
    const matcher = actionMatcher(match)

    return [...this.appActions.values()].filter(matcher)
  }

  /**
   * Add action object
   *
   * @param {Action | ActionOptions} actionArg
   */
  add(actionArg: Action | ActionOptions)

  /**
   * Add with specific id
   *
   * @param {string} id
   * @param {Action | ActionOptions} actionArg
   */
  add(id: string, actionArg: Action | ActionOptions)

  @Bind
  add(
    idOrAction: string | Action | ActionOptions,
    actionArg?: Action | ActionOptions
  ) {
    let id: string = null
    if (isString(idOrAction)) {
      id = idOrAction
    } else if (isObject(idOrAction)) {
      id = idOrAction.id
      actionArg = idOrAction
    }

    const action =
      actionArg instanceof Action ? actionArg : new Action(actionArg)
    this.appActions.set(id, action)
    this.emit("appActionsChanged", this.appActions)
  }

  @Bind
  addAll(
    ...actionArgs: Array<Action | Action[] | ActionOptions | ActionOptions[]>
  ) {
    const actions = flatten(actionArgs).map(arg =>
      arg instanceof Action ? arg : new Action(arg)
    )
    actions.forEach(this.add)
  }

  @Bind
  register(id: string, action: Action) {
    this.add(id, action)
  }

  @Bind
  remove(id: string) {
    this.appActions.delete(id)
  }

  @Bind
  removeAll(...ids: string[]) {
    ids.forEach(id => {
      this.appActions.delete(id)
    })
  }


  @Bind
  deregister(id: string) {
    this.remove(id)
  }

  @Bind
  all(type?: ActionType) {
    return !type
      ? [...this.appActions.values()]
      : [...this.appActions.values()].filter(propEqualTo("type", type))
  }

  hasContainer(containerOrId: ActionContainer | string) {
    const containerId = isString(containerOrId)
      ? containerOrId
      : containerOrId.id
    return this.containers.some(propEqualTo("id", containerId))
  }

  /**
   * Remove container
   *
   * @param containerOrId
   * @returns
   */
  removeContainer(containerOrId: ActionContainer | string) {
    const containerId = isString(containerOrId)
      ? containerOrId
      : containerOrId.id
    if (!this.hasContainer(containerId)) {
      debug(`Container is not known (%s)`, containerId)
    } else {
      // Unregister all container actions
      const container = this.containers.find(propEqualTo("id", containerId))
      container.allActionIds.forEach(id => this.appActions.delete(id))

      // Remove container
      removeFirstMutation(this.containers, propEqualTo("id", containerId))

      this.emit("containerRemoved", container)
      this.emit("containersChanged", this.containers)
    }

    return this
  }

  addContainer(container: ActionContainer) {
    if (this.hasContainer(container)) {
      warn(`Container (${container.id}) already added`)
      return this
    }

    this.containers.push(container)
    this.emit("containerAdded", container)
    this.emit("containersChanged", this.containers)
    return this
  }

  /**
   * Rebuild actions on container change
   */
  @Bind
  private onContainersChanged() {
    this.state.containerActions = this.containers.flatMap(
      (container) =>
            container.allActions
              .map(action =>
                action instanceof Action ? action : new Action(action)
              )

          )

    this.rebuildAllActions()
  }

  @Bind
  private onAppActionsChanged() {
    this.rebuildAllActions()
  }

  @Bind
  private rebuildAllActions() {
    this.state.allActions = Array<Action>(
      ...this.appActions.values(),
      ...this.containerActions
    ).reverse()
  }

  get allContainers() {
    return [...this.containers.values()]
  }

  /**
   * Get a copy of the registry
   *
   * @return {Map<string, Action>}
   */
  getRegistry() {
    return new Map(this.appActions)
  }

  constructor() {
    super()

    devExposeGlobal("actionRegistry", this)

    this.on("containersChanged", this.onContainersChanged)
    this.on("appActionsChanged", this.onAppActionsChanged)
  }
}

export default ActionRegistry
