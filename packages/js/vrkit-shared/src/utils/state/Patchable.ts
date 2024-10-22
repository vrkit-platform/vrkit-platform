import { assign } from "lodash"
import { cloneShallow } from "../ObjectUtil"

export abstract class Patchable<State extends {}> {
  patch(patch: Partial<State>):State {
    const { state } = this
    assign(state, cloneShallow(patch))
    return state
  }

  protected constructor(public readonly state: State) {}
}
