import EventEmitter from "eventemitter3"
import { Option, Tuple2, asOption } from "@3fv/prelude-ts"
import {
  getValue,
  isFunction,
  isPromise,
  isString
} from "@3fv/guard"

import { isError } from "../Guards"
import { getLogger } from "@3fv/logger-proxy"

import { range } from "lodash"
import { Deferred } from "@3fv/deferred"

const log = getLogger(__filename)

export interface WorkflowStepState<
  Data extends object = any
> {
  id: string
  data: Data
  error: Error
  complete: boolean
}

export enum WorkflowStatus {
  NotStarted = "NotStarted",
  Running = "Running",
  Complete = "Completes",
  Failed = "Failed"
}

export enum WorkflowEvent {
  StatusChanged = "StatusChanged"
}

export type WorkflowStepEntry = Tuple2<
  WorkflowStep,
  WorkflowStepState
>

export interface WorkflowState {
  readonly steps: Record<string, WorkflowStepEntry>
  readonly stepCount: number
  currentIndex: number
  readonly status: WorkflowStatus

  readonly isSettled: boolean
  readonly isComplete: boolean
  readonly isCancelled: boolean
  readonly isRunning: boolean
  readonly isFailed: boolean
}

export type IsEnabled = boolean | (() => boolean)

export type WorkflowEventHandler<
  WorkflowType extends Workflow,
  Event extends WorkflowEvent,
  Data = any
> = (
  event: WorkflowEvent,
  workflow: WorkflowType,
  state: WorkflowState,
  error: Error
) => void | Promise<void>

/**
 * The control interface for workflows
 */
export type WorkflowControl = WorkflowState & {
  run: () => Promise<Workflow>
  reset: () => Promise<Workflow>
  cancel: () => Promise<Workflow>

  once<Event extends WorkflowEvent, Data = any>(
    event: Event,
    handler: WorkflowEventHandler<Workflow, Event, Data>
  ): void
  on<Event extends WorkflowEvent, Data = any>(
    event: Event,
    handler: WorkflowEventHandler<Workflow, Event, Data>
  ): void
  off<Event extends WorkflowEvent, Data = any>(
    event: Event,
    handler?: WorkflowEventHandler<Workflow, Event, Data>
  ): void
}

export type WorkflowStepFn<
  WorkflowType extends Workflow = Workflow,
  WorkflowStateType extends WorkflowState = Workflow
> = (
  workflow: WorkflowType,
  state: WorkflowStateType,
  stepState: WorkflowStepState
) => Promise<void>

/**
 * A workflow step definition
 */
export interface WorkflowStep<
  T extends WorkflowState = WorkflowState
> {
  id: string
  index: number
  isEnabled: IsEnabled
  name: string
  description: string
  fn: WorkflowStepFn
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  steps: Array<WorkflowStep>
  name: string
  description: string
}

/**
 * Create a new workflow state
 *
 * @return {{runDeferred:Deferred<void> | undefined | null, cancelled:boolean, error:Error |
 *   undefined | null, currentIndex:number, status:WorkflowStatus}}
 */
function newWorkflowState() {
  return {
    status: WorkflowStatus.NotStarted,
    cancelled: false,
    runDeferred: null as Deferred<void>,
    error: null as Error,

    /**
     * Current index
     */
    currentIndex: 0
  }
}

/**
 * Workflow itself
 */
export class Workflow implements WorkflowControl {
  static builder(
    name: string,
    description: string = name
  ): WorkflowBuilder {
    // STEPS FOR BUILDER
    const steps = Array<WorkflowStep>()

    // BUILDER REFERENCE
    let builderRef: any = undefined

    // THE BUILDER FN
    const buildFn = Option.of(
      (
        idOrStep: string | WorkflowStep,
        name: string = undefined,
        descriptionOrFn:
          | string
          | WorkflowStepFn = undefined,
        fnOrIsEnabled:
          | WorkflowStepFn
          | IsEnabled = undefined,
        isEnabledFn: IsEnabled = undefined
      ) => {
        const [description, fn, isEnabled] = isFunction(
            descriptionOrFn
          )
            ? [
                name,
                descriptionOrFn as WorkflowStepFn,
                isFunction(fnOrIsEnabled)
                  ? (fnOrIsEnabled as IsEnabled)
                  : typeof fnOrIsEnabled === "boolean"
                  ? fnOrIsEnabled
                  : true
              ]
            : [
                descriptionOrFn as string,
                fnOrIsEnabled as WorkflowStepFn,
                isFunction(isEnabledFn)
                  ? isEnabledFn
                  : typeof isEnabledFn === "boolean"
                  ? isEnabledFn
                  : true
              ],
          toStep = (idOrStep: WorkflowStep | string) =>
            isString(idOrStep)
              ? {
                  index: steps.length,
                  id: idOrStep as string,
                  name,
                  description,
                  fn,
                  isEnabled
                }
              : (idOrStep as WorkflowStep)

        steps.push(toStep(idOrStep))

        return builderRef
      }
    )
      .map(fn =>
        Object.assign(fn, {
          steps,
          create: () =>
            new Workflow(builderRef as WorkflowBuilder)
        })
      )
      .get()

    builderRef = buildFn
    ;(buildFn as any).create = () =>
      new Workflow(builderRef as WorkflowBuilder)
    return builderRef as WorkflowBuilder
  }

  private emitter = new EventEmitter()

  private eventHandlerMap = new Map<
    string,
    Map<Function, Function>
  >(
    Object.keys(WorkflowEvent).map(name => [
      name,
      new Map<Function, Function>()
    ])
  )

  private getHandlerFn<
    Event extends WorkflowEvent,
    Data = any
  >(
    event: Event,
    handler: WorkflowEventHandler<Workflow, Event, Data>
  ): Function {
    return this.eventHandlerMap.get(event).get(handler)
  }

  private state = newWorkflowState()

  readonly steps: Record<string, WorkflowStepEntry>

  readonly name: string

  readonly description: string

  get currentIndex(): number {
    return this.state.currentIndex
  }

  get isSettled(): boolean {
    return [
      this.isComplete,
      this.isFailed,
      this.isCancelled
    ].some(it => it === true)
  }

  get isComplete(): boolean {
    return (
      !this.isRunning &&
      this.status === WorkflowStatus.Complete
    )
  }

  get isCancelled(): boolean {
    return !this.isRunning && this.state.cancelled
  }

  get isRunning(): boolean {
    return (
      this.status !== WorkflowStatus.Running &&
      (!this.state.runDeferred ||
        this.state.runDeferred.isSettled())
    )
  }

  get isFailed(): boolean {
    return (
      !this.isRunning &&
      this.status === WorkflowStatus.Failed
    )
  }

  private async setStatus(
    status: WorkflowStatus,
    err: Error = undefined
  ) {
    this.state.status = status
    this.state.error = err

    await this.emit(
      WorkflowEvent.StatusChanged,
      isError(err) ? err : this
    )
  }

  /**
   * Status
   */

  get status() {
    return this.state.status
  }

  off<Event extends WorkflowEvent, Data = any>(
    event: Event,
    handler?: WorkflowEventHandler<Workflow, Event, Data>
  ) {
    asOption(
      this.getHandlerFn<Event, Data>(event, handler)
    ).ifSome(fn => {
      this.emitter.off(event, fn as any)
    })
  }

  on<Event extends WorkflowEvent, Data = any>(
    event: Event,
    handler: WorkflowEventHandler<Workflow, Event, Data>,
    once: boolean = false
  ) {
    asOption(
      this.getHandlerFn<Event, Data>(event, handler)
    ).ifSome(() => {
      throw Error(
        `This function is already assigned to another event on this workflow`
      )
    })

    const wrappedHandler = (arg: Error | WorkflowState) => {
      // IF THIS IS A `once` HANDLER, THEN REMOVE IT NOW
      if (!once) {
        this.off<Event, Data>(event, handler)
      }

      const args = asOption<[WorkflowState, Error]>(
        isError(arg)
          ? [undefined, arg as Error]
          : [arg as WorkflowState, undefined]
      ).get()

      // INVOKE THE REAL HANDLER
      return handler(event, this, ...args)
    }

    this.eventHandlerMap
      .get(event)
      .set(handler, wrappedHandler)

    this.emitter.on(event, wrappedHandler)
  }

  /**
   * Register a one-time-use / `once` handler
   *
   * @param {Event} event
   * @param {WorkflowEventHandler<Workflow, Event, Data>} handler
   */
  once<Event extends WorkflowEvent, Data = any>(
    event: Event,
    handler: WorkflowEventHandler<Workflow, Event, Data>
  ) {
    return this.on(event, handler, true)
  }

  /**
   * Emit an event
   *
   * @param {WorkflowEvent} event
   * @param dataOrError
   * @returns {Promise<void>}
   */
  async emit<Event extends WorkflowEvent, Data = any>(
    event: Event,
    dataOrError: Data | Error
  ): Promise<void> {
    try {
      for await (const handler of [
        ...this.emitter.listeners(event)
      ]) {
        const result = handler(event, dataOrError)
        if (isPromise(result)) {
          await result
        }
      }
    } catch (err) {
      log.error(
        "Unable to dispatch event",
        event,
        dataOrError
      )
    }
  }

  /**
   * Number of configured steps
   * @returns {number}
   */
  get stepCount(): number {
    return Object.keys(this.steps).length
  }

  /**
   * Reset the workflow
   *
   * @returns {Promise<Workflow>}
   */
  async reset(): Promise<Workflow> {
    const { runDeferred } = this.state
    if (!!runDeferred && !runDeferred.isSettled()) {
      await runDeferred.promise.catch(err =>
        log.warn("Cleanup failed", err)
      )
    }

    if (!this.isSettled) {
      await this.cancel().catch(err =>
        log.warn("Cancel failed", err)
      )
    }

    this.state = newWorkflowState()

    return this
  }

  /**
   * Cancel workflow
   *
   * @returns {Promise<Workflow>}
   */
  async cancel(): Promise<Workflow> {
    if (this.isCancelled) {
      return this
    }

    this.state.cancelled = true

    const { runDeferred } = this.state

    if (
      this.isRunning ||
      !getValue(() => runDeferred.isSettled(), true)
    ) {
      try {
        runDeferred.cancel()
        await runDeferred.promise
      } catch (err) {
        log.warn("Cancel was not clean", err)
      }
    }

    return this
  }

  /**
   * Execute the entire workflow
   *
   * @returns {Promise<WorkflowControl>}
   */
  async run(): Promise<Workflow> {
    try {
      await this.setStatus(WorkflowStatus.Running)

      const stepEntries = Object.values(this.steps)

      for await (const index of range(
        0,
        stepEntries.length
      )) {
        this.state.currentIndex = index

        const entry = stepEntries[index],
          [step, state] = [entry.fst(), entry.snd()],
          { isEnabled, fn } = step

        log.info(
          `(${this.name}) (index=${index}, step=${step.name}): Starting`
        )

        try {
          const enabled = isFunction(isEnabled)
            ? isEnabled()
            : isEnabled

          if (enabled) {
            await fn(this, this, state)
            log.info(
              `(${this.name}) (index=${index}, step=${step.name}): Completed`
            )
          } else {
            log.info(
              `(${this.name}) (index=${index}, step=${step.name}): Skipped, isEnabled=${enabled}`
            )
          }
        } catch (err) {
          log.error(
            `(${this.name}) (index=${index}, step=${step.name}): Failed`,
            err
          )
          await this.setStatus(WorkflowStatus.Failed, err)
          throw err
        }
      }

      this.setStatus(WorkflowStatus.Complete)
    } catch (err) {
      log.error(`Workflow failed ${this.name}`, err)
      if (this.state.status !== WorkflowStatus.Failed) {
        await this.setStatus(WorkflowStatus.Failed, err)
      }
    }
    return this
  }

  /**
   * New workflow definition
   *
   * @param {WorkflowDefinition} def
   */
  constructor(def: WorkflowDefinition) {
    Object.assign(this, {
      name: def.name,
      description: def.description,
      steps: def.steps.reduce(
        (map, step) => ({
          ...map,
          [step.id]: Tuple2.of(step, {
            id: step.id,
            data: {},
            error: null,
            complete: false
          })
        }),
        {} as Record<string, WorkflowStepEntry>
      )
    })
  }
}

/**
 * A common simple builder
 */
export interface WorkflowBuilder
  extends WorkflowDefinition {
  (step: WorkflowStep): WorkflowBuilder

  (
    id: string,
    name: string,
    fn: WorkflowStepFn,
    isEnabled?: IsEnabled
  )

  (
    id: string,
    name: string,
    description: string,
    fn: WorkflowStepFn,
    isEnabled?: IsEnabled
  ): WorkflowBuilder

  create: () => Workflow
}

// /**
//  * Static workflow functions
//  */
// export namespace Workflow {
//
//   /**
//    * A new workflow builder
//    *
//    * @param {string} name
//    * @param {string} description
//    * @returns {WorkflowBuilder}
//    */
//   export function
// }
