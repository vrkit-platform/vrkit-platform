import { getLogger } from "@3fv/logger-proxy"
import { Singleton } from "@3fv/ditsy"
import { Action, ActionOptions, ActionType } from "./ActionTypes"
import {
  devExposeGlobal, equalTo, isEqual, Pair, propEqualTo, removeFirstMutation
} from "../../utils"
import { flatten } from "lodash"
import { assert, isBoolean, isObject, isString } from "@3fv/guard"
import { Bind, MemoizeGetter } from "../../decorators"
import { asOption, Predicate } from "@3fv/prelude-ts"
import type { ActionContainer } from "./ActionContainer"
import EventEmitter3 from "eventemitter3"
import { get } from "lodash/fp"
import { AppActionIdName } from "./AppActionIds"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

function actionMatcher(match: Partial<Action>):Predicate<Action> {
  const criteria:[string, any][] = Object.entries(match)
  return Predicate.of<Action>((action:Action) =>
    criteria.every(([key, value]) => isEqual(action[key], value))
  )
}

export interface ActionRegistryEvents {
  actionsChanged: (actionMap: Map<string, Action>) => any
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
  get containerIds():string[] {
    return this.containers.map(get("id"))
  }

  /**
   * Internal private state
   */
  private readonly state:{ allActions:Action[]; containerActions:Action[] } = {
    
    containerActions: Array<Action>(),
    allActions: Array<Action>()
  }

  private readonly actionMap:Map<string, Action> = new Map<string, Action>()

  get containerActions():Action[] {
    return this.state.containerActions
  }
  
  get globalActions():Action[] {
    return this.state.allActions.filter((action:Action) => action.type === ActionType.Global)
  }
  
  get globalActionIds():string[] {
    return this.globalActions.map(get("id"))
  }

  /**
   * Get all actions as a list
   *
   * @return {Action[]}
   */

  get allActions():Action[] {
    return this.state.allActions
  }

  /**
   * Get a specific action
   *
   * @param {string} id
   * @return {Action}
   */
  @Bind
  get(id: string | AppActionIdName):Action {
    return this.actionMap.get(id)
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
    const matcher:Predicate<Action> = actionMatcher(match)
    for (const [, value] of this.actionMap) {
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
    const matcher:Predicate<Action> = actionMatcher(match)

    return [...this.actionMap.values()].filter(matcher)
  }

  /**
   * Add action object
   *
   * @param {Action | ActionOptions} actionArg
   */
  add(actionArg: Action | ActionOptions, skipEmit?:boolean)

  /**
   * Add with specific id
   *
   * @param {string} id
   * @param {Action | ActionOptions} actionArg
   */
  add(id: string, actionArg: Action | ActionOptions, skipEmit?: boolean)

  @Bind
  add(
    idOrAction: string | Action | ActionOptions,
    actionArg: Action | ActionOptions | boolean = null,
      skipEmit: boolean = false
  ):void {
    let id: string = null
    if (isBoolean(actionArg)) {
      skipEmit = actionArg
      actionArg = null
    }
    if (isString(idOrAction)) {
      id = idOrAction
    } else if (isObject(idOrAction)) {
      id = idOrAction.id
      actionArg = idOrAction
    }

    const action:Action =
      actionArg instanceof Action ? actionArg : new Action(actionArg as (Action | ActionOptions))
    
    this.actionMap.set(id, action)
    
    if (!skipEmit)
      this.emit("actionsChanged", this.actionMap)
  }

  @Bind
  addAll(
    ...actionArgs: Array<Action | Action[] | ActionOptions | ActionOptions[]>
  ):void {
    const actions:Action[] = flatten(actionArgs).map((arg:Action | ActionOptions) =>
      arg instanceof Action ? arg : new Action(arg)
    )
    actions.forEach(it => this.add(it,true))
    
    this.emit("actionsChanged", this.actionMap)
  }

  @Bind
  register(id: string, action: Action):void {
    this.add(id, action)
  }

  @Bind
  remove(id: string):void {
    this.actionMap.delete(id)
  }

  @Bind
  removeAll(...ids: string[]):void {
    ids.forEach((id:string) => {
      this.actionMap.delete(id)
    })
  }


  @Bind
  deregister(id: string):void {
    this.remove(id)
  }

  @Bind
  all(type?: ActionType):Action[] {
    return !type
      ? [...this.actionMap.values()]
      : [...this.actionMap.values()].filter(propEqualTo("type", type))
  }

  hasContainer(containerOrId: ActionContainer | string):boolean {
    const containerId:string = isString(containerOrId)
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
  removeContainer(containerOrId: ActionContainer | string):this {
    const containerId:string = isString(containerOrId)
      ? containerOrId
      : containerOrId.id
    if (!this.hasContainer(containerId)) {
      debug(`Container is not known (%s)`, containerId)
    } else {
      // Unregister all container actions
      const container:ActionContainer = this.containers.find(propEqualTo("id", containerId))
      container.allActionIds.forEach((id:string) => this.actionMap.delete(id))

      // Remove container
      removeFirstMutation(this.containers, propEqualTo("id", containerId))

      this.emit("containerRemoved", container)
      this.emit("containersChanged", this.containers)
    }

    return this
  }

  addContainer(container: ActionContainer):this {
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
  private onContainersChanged():void {
    this.state.containerActions = this.containers.flatMap(
      (container:ActionContainer) =>
            container.allActions
              .map((action:ActionOptions) =>
                action instanceof Action ? action : new Action(action)
              )

          )

    this.rebuildAllActions()
  }

  @Bind
  private onAppActionsChanged():void {
    this.rebuildAllActions()
  }

  @Bind
  private rebuildAllActions():void {
    this.state.allActions = Array<Action>(
      ...this.actionMap.values(),
      ...this.containerActions
    ).reverse()
  }

  get allContainers():ActionContainer[] {
    return [...this.containers.values()]
  }

  /**
   * Get a copy of the registry
   *
   * @return {Map<string, Action>}
   */
  getRegistry():Map<string, Action> {
    return new Map(this.actionMap)
  }
  
  

  constructor() {
    super()

    devExposeGlobal("actionRegistry", this)

    this.on("containersChanged", this.onContainersChanged)
    this.on("actionsChanged", this.onAppActionsChanged)
  }
}

export default ActionRegistry
