import { isEqual } from "../ObjectUtil"
import type { Lambda } from "mobx"
import { getLogger } from "@3fv/logger-proxy"
import EventEmitter3 from "eventemitter3"
import { Bind } from "../decorators"
import { asOption } from "@3fv/prelude-ts"
import { isDefined, isFunction } from "@3fv/guard"
import { match } from "ts-pattern"
import { deepObserve } from "mobx-utils"

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

  startImmediate: boolean
  
  predicate?: CachedStateComputationPredicate<S, V, T, C>
  
  customCacheInit?: C | (() => C)
}

function newCachedStateComputationSelectorOptionsDefault<S extends {}, V, T, C>(): CachedStateComputationOptions<S, V, T, C> {
  return {
    isEqual: isEqual,
    startImmediate: true,
    predicate: null,
    customCacheInit: null
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
  return (sourceValue, oldSourceValue, selectorState): T => sourceValue as (T extends V ? T : never)
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

  // private attached_: boolean = false
  private stopObserving_: Lambda = null
  
  // private onChange(change: IValueDidChange<S>) {
  private onChange(change: any, path: any, root: any) {
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
    this.emit(CachedStateComputationEventType.CHANGED, ev)
  }

  @Bind dispose() {
    this.stop()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  constructor(
    observableState: S,
    readonly sourceSelector: CachedStateComputationSourceSelector<S, V, T, C>,
    readonly transformer: CachedStateComputationTransformer<S, V, T, C> = newCachedStateComputationTransformerDefault<S, V,T,C>(),
    overrideOptions: Partial<CachedStateComputationOptions<S, V, T, C>> = {}
  ) {
    super()

    this.state_ = {
      source: null,
      target: null,
      observableState,
      updatedAt: 0,
    }
    
    const options = this.options_ = { ...newCachedStateComputationSelectorOptionsDefault<S, V, T, C>(), ...overrideOptions }
    this.state_.customCache = match(options.customCacheInit)
        .when(isFunction, it => it())
        .when(isDefined, it => it)
        .otherwise(() => null)
    
    if (options.startImmediate)
      this.start()
    
  }
  
  start() {
    if (!this.stopObserving_) {
      // this.stopObserving_ = observe(this.observableState, this.onChange.bind(this))
      this.stopObserving_ = deepObserve(this.observableState, this.onChange.bind(this))
    }
    return this
  }
  
  stop() {
    if (this.stopObserving_) {
      asOption(this.stopObserving_)
          .filter(isFunction)
          .ifSome(stopObserving => stopObserving())
      this.stopObserving_ = null
    }
    return this
  }
  
  get isStarted() {
    return !!this.stopObserving_
  }
  
  get isAttached() {
    return this.isStarted
  }
  
  get isObserving() {
    return this.isStarted
  }
  
  get isRunning() {
    return this.isStarted
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
