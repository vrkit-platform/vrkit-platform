import type {
  IArrayDidChange,
  IAutorunOptions,
  IEqualsComparer,
  IMapDidChange,
  IObjectDidChange,
  IReactionDisposer
} from "mobx"
import { reaction } from "mobx"
import { isEqual } from "@vrkit-platform/shared"
import { asOption } from "@3fv/prelude-ts"

// noinspection TypeScriptDuplicateUnionOrIntersectionType
export type IObserveChange<T = any> = IObjectDidChange<T> | IArrayDidChange<T> | IMapDidChange<T>

export type StateReactionOptions<T, FireImmediately extends boolean> = IAutorunOptions & {
  fireImmediately?: FireImmediately
  equals?: IEqualsComparer<T>
}

export function StateReaction<T, FireImmediately extends boolean = false>(
  selectorFn: () => T,
  effectFn: (data: T) => any,
  extraOptions: StateReactionOptions<T, FireImmediately> = {}
): IReactionDisposer {
  return asOption({ equals: isEqual, fireImmediately: false, ...extraOptions })
      .map(options => reaction(selectorFn, effectFn, options))
      .getOrThrow()
}
