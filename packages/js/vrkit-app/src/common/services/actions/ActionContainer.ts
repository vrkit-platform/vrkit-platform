import type { ActionOptions } from "./ActionTypes"



export class ActionContainer {

  private readonly actions:Map<string, ActionOptions>

  get allActions() {
    return [...this.actions.values()]
  }

  get allActionIds() {
    return [...this.actions.keys()]
  }

  getAction(id: string) {
    return this.actions.get(id)
  }

  hasAction(id: string) {
    return this.actions.has(id)
  }

  constructor(
    readonly id: string,
    actions: Record<string, ActionOptions>
  ) {
    this.actions = new Map<string, ActionOptions>(
      Object.entries(actions)
    )
  }


}
