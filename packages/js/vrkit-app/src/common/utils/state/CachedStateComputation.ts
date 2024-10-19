import { isEqual } from "../ObjectUtil"
import { Disposables } from "../Disposables"
import type { IValueDidChange } from "mobx"
import { observe } from "mobx"
import { getLogger } from "@3fv/logger-proxy"
import EventEmitter3 from "eventemitter3"
import { Bind } from "../decorators"
import { C, S, T, V } from "@fullcalendar/core/internal-common"
import { options } from "axios"

const log = getLogger(__filename)

export type CachedStateComputationSourceSelector<S extends {}, V, T, C> = (
  state: S,
  selectorState: CachedStateComputationState<S, V, T, C>
) => V

export type CachedStateComputationSourceIsEqual<V> = (newValue: V, oldValue: V) => boolean

export type CachedStateComputationTransformer<S extends {}, V, T, C> = (
  sourceValue: V,
  oldSourceValue: V,
  selectorState: CachedStateComputationState<S, V, T, C>
) => T

/**
 * (Optional) final filtering predicate
 */
export type CachedStateComputationPredicate<S extends {}, V, T, C> = (
  values: CachedStateComputationTargetSource<V, T>,
  oldValues: CachedStateComputationTargetSource<V, T>,
  selectorState: CachedStateComputationState<S, V, T, C>
) => boolean

/**
 * Selector options
 */
export interface CachedStateComputationOptions<S extends {}, V, T, C> {
  isEqual: CachedStateComputationSourceIsEqual<V>

  // fireImmediate: boolean

  predicate?: CachedStateComputationPredicate<S, V, T, C>
}

function newCachedStateComputationSelectorOptionsDefault<S extends {}, V, T, C>(): CachedStateComputationOptions<S, V, T, C> {
  return {
    isEqual: isEqual,
    predicate: null
    // fireImmediate: false
  }
}

export interface CachedStateComputationState<S extends {}, V, T, C> {
  source: V

  target: T

  updatedAt: number

  observableState: S

  customCache?: C
}

function newCachedStateComputationTransformerDefault<S extends {}, V, T, C>(): CachedStateComputationTransformer<S, V, T, C> {
  return (sourceValue, oldSourceValue, selectorState): T => sourceValue as T
}

export enum CachedStateComputationEventType {
  CHANGED = "CHANGED"
}

/**
 * Source value that was used to generate the target value
 */
export interface CachedStateComputationTargetSource<V, T> {
  target: T

  source: V
}

/**
 * Change event struct
 */
export interface CachedStateComputationChangeEvent<S extends {}, V, T, C> extends CachedStateComputationTargetSource<V, T> {
  old: CachedStateComputationTargetSource<V, T>

  selectorState: CachedStateComputationState<S, V, T, C>

  updatedAt: number
}

/**
 * Interface representing event types for an Observable Memo Selector.
 *
 * @template S - The shape of the state.
 * @template V - The type of value selected from the state
 * @template T - The type of the final transformed value, this may `===` V.
 * @template C - The type of `customCache` on the `SelectorState`
 *
 * @interface CachedStateComputationEventTypes
 * @property [CachedStateComputationEventType.CHANGED] - An event that is
 *     triggered when there is a change in the observable memo selector.
 * @param {CachedStateComputationChangeEvent<S, V, T, C>} ev - The event object
 *     containing details about the change.
 */
export interface CachedStateComputationEventTypes<S extends {}, V, T, C> {
  [CachedStateComputationEventType.CHANGED]: (ev: CachedStateComputationChangeEvent<S, V, T, C>) => void
}

export class CachedStateComputation<S extends {}, V, T = V, C = unknown> extends EventEmitter3<
  CachedStateComputationEventTypes<S, V, T, C>
> {
  private readonly state_: CachedStateComputationState<S, V, T, C>

  private readonly options_: CachedStateComputationOptions<S, V, T, C>

  private readonly disposers_ = new Disposables()

  private onChange(change: IValueDidChange<S>) {
    const state = this.state_,
      source = this.sourceSelector(this.observableState, state),
      { isEqual, predicate } = this.options

    if (isEqual(source, state.source)) {
      log.debug(`Object is unchanged`)
      return
    }

    if (log.isDebugEnabled()) {
      log.debug(`Object changed`, { new: source, old: state.source })
    }

    // STORE OLD SOURCE/TARGET FOR EMIT
    const old = {
        source: state.source,
        target: state.target
      },
      target = this.transformer(source, state.source, state)

    // IF PREDICATE PROVIDED, THEN USE IT
    if (!!predicate && !predicate({ target, source }, old, state)) {
      if (log.isDebugEnabled()) {
        log.debug(`Predicate excluded change`, { target, source }, "from", old)
      }
      return
    }

    // UPDATE THE STATE
    Object.assign(state, {
      target,
      source,
      updatedAt: Date.now()
    })

    // EMIT THE CHANGE
    const ev: CachedStateComputationChangeEvent<S, V, T, C> = {
      old,
      selectorState: this.state,
      target: state.target,
      source: state.source,
      updatedAt: state.updatedAt
    }
    this.emit("CHANGED", ev)
  }

  @Bind dispose() {
    this.disposers_.dispose()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  constructor(
    observableState: S,
    readonly sourceSelector: CachedStateComputationSourceSelector<S, V, T, C>,
    readonly transformer: CachedStateComputationTransformer<S, V, T, C> = newCachedStateComputationTransformerDefault<S, V>(),
    options: Partial<CachedStateComputationOptions<S, V, T, C>> = {}
  ) {
    super()

    this.state_ = {
      source: null,
      target: null,
      observableState,
      updatedAt: 0
    }

    this.options_ = { ...options, ...newCachedStateComputationSelectorOptionsDefault<S, V, T>() }
    this.disposers_.push(observe(observableState, this.onChange.bind(this), false))
  }

  get state() {
    return this.state_
  }

  get observableState() {
    return this.state.observableState
  }

  get options() {
    return this.options_
  }
  
  
}
