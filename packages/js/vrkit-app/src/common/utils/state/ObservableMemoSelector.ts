import { isEqual } from "../ObjectUtil"
import { Disposables } from "../Disposables"
import type { IValueDidChange } from "mobx"
import { observe } from "mobx"
import { getLogger } from "@3fv/logger-proxy"
import EventEmitter3 from "eventemitter3"
import { Bind } from "../decorators"

const log = getLogger(__filename)

export type ObservableMemoSourceSelector<S extends {}, V, T, C> = (
  state: S,
  selectorState: ObservableMemoSelectorState<S, V, T, C>
) => V

export type ObservableMemoSourceIsEqual<V> = (newValue: V, oldValue: V) => boolean

export type ObservableMemoTransformer<S extends {}, V, T, C> = (
  sourceValue: V,
  oldSourceValue: V,
  selectorState: ObservableMemoSelectorState<S, V, T, C>
) => T

/**
 * (Optional) final filtering predicate
 */
export type ObservableMemoPredicate<S extends {}, V, T, C> = (
  values: ObservableMemoTargetSource<V, T>,
  oldValues: ObservableMemoTargetSource<V, T>,
  selectorState: ObservableMemoSelectorState<S, V, T, C>
) => boolean

/**
 * Selector options
 */
export interface ObservableMemoSelectorOptions<S extends {}, V, T, C> {
  isEqual: ObservableMemoSourceIsEqual<V>

  // fireImmediate: boolean

  predicate?: ObservableMemoPredicate<S, V, T, C>
}

function newObservableMemoSelectorOptionsDefault<S extends {}, V, T, C>(): ObservableMemoSelectorOptions<S, V, T, C> {
  return {
    isEqual: isEqual,
    predicate: null
    // fireImmediate: false
  }
}

export interface ObservableMemoSelectorState<S extends {}, V, T, C> {
  source: V

  target: T

  updatedAt: number

  observableState: S

  cache?: C
}

function newObservableMemoTransformerDefault<S extends {}, V, T, C>(): ObservableMemoTransformer<S, V, T, C> {
  return (sourceValue, oldSourceValue, selectorState): T => sourceValue as T
}

export enum ObservableMemoSelectorEventType {
  CHANGED = "CHANGED"
}

/**
 * Source value that was used to generate the target value
 */
export interface ObservableMemoTargetSource<V, T> {
  target: T

  source: V
}

/**
 * Change event struct
 */
export interface ObservableMemoChangeEvent<S extends {}, V, T, C> extends ObservableMemoTargetSource<V, T> {
  old: ObservableMemoTargetSource<V, T>

  selectorState: ObservableMemoSelectorState<S, V, T, C>

  updatedAt: number
}

/**
 * Interface representing event types for an Observable Memo Selector.
 *
 * @template S - The shape of the state.
 * @template V - The type of value selected from the state
 * @template T - The type of the final transformed value, this may `===` V.
 * @template C - The type of `cache` on the `SelectorState`
 *
 * @interface ObservableMemoSelectorEventTypes
 * @property [ObservableMemoSelectorEventType.CHANGED] - An event that is
 *     triggered when there is a change in the observable memo selector.
 * @param {ObservableMemoChangeEvent<S, V, T, C>} ev - The event object
 *     containing details about the change.
 */
export interface ObservableMemoSelectorEventTypes<S extends {}, V, T, C> {
  [ObservableMemoSelectorEventType.CHANGED]: (ev: ObservableMemoChangeEvent<S, V, T, C>) => void
}

export class ObservableMemoSelector<S extends {}, V, T = V, C = unknown> extends EventEmitter3<
  ObservableMemoSelectorEventTypes<S, V, T, C>
> {
  private readonly state_: ObservableMemoSelectorState<S, V, T, C>

  private readonly options_: ObservableMemoSelectorOptions<S, V, T, C>

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
    const ev: ObservableMemoChangeEvent<S, V, T, C> = {
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
    readonly sourceSelector: ObservableMemoSourceSelector<S, V, T, C>,
    readonly transformer: ObservableMemoTransformer<S, V, T, C> = newObservableMemoTransformerDefault<S, V>(),
    options: Partial<ObservableMemoSelectorOptions<S, V, T, C>> = {}
  ) {
    super()

    this.state_ = {
      source: null,
      target: null,
      observableState,
      updatedAt: 0
    }

    this.options_ = { ...options, ...newObservableMemoSelectorOptionsDefault<S, V, T>() }
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
