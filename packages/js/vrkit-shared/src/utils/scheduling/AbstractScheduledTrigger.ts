import { Deferred } from "@3fv/deferred"
// import { Bind } from "../../decorators"
import { Future, Option } from "@3fv/prelude-ts"
import { isPromise } from "@3fv/guard"
import { assign } from "lodash"
import { getLogger } from "@3fv/logger-proxy"


const log = getLogger(__filename)
const { info, debug, warn, error } = log

export type ScheduledTriggerMode = "manual" | "auto"

export abstract class AbstractScheduledTrigger {
  private readonly state: {
    running: boolean
    executeDeferred: Deferred<any>
    interval: number
    timeout: NodeJS.Timeout
    mode: ScheduledTriggerMode
  }

  get mode() {
    return this.state.mode
  }

  
  private executeWrapper() {
    this.clear()

    if (!this.running) {
      return
    }

    if (this.state.executeDeferred) {
      warn(`Still executing previous trigger`)
      return this.state.executeDeferred.promise.then(
        this.executeWrapper.bind(this)
      )
    }

    const deferred = (this.state.executeDeferred =
      new Deferred<any>())
    return Future.of(
      Option.try(() => this.execute())
        .map(res =>
          isPromise(res) ? res : Promise.resolve(res)
        )
        .map(promise =>
          promise
            .catch(err => {
              error(`Scheduled trigger failed`, err)
              return null
            })
            .then(deferred.resolve, deferred.reject)
        )
        .get()
    ).onComplete(() => {
      this.state.executeDeferred = null
      this.schedule()
    })
  }

  protected clear() {
    const { state } = this
    if (state.timeout) {
      clearTimeout(state.timeout)
    }

    assign(state, {
      timeout: null
    })
  }

  protected schedule() {
    this.clear()
    if (this.running) {
      assign(this.state, {
        timeout: setTimeout(
          this.executeWrapper,
          this.state.interval
        )
      })
    }
  }

  /**
   * Function triggered when timeout fires
   *
   * @returns {any}
   * @protected
   */
  protected abstract execute(): Promise<any> | any

  /**
   * Trigger running state
   *
   * @returns {boolean}
   */
  get running() {
    return this.state.running
  }

  start() {
    if (this.state.running) {
      warn(`Already running, start() is ignored`)
      return
    }

    this.state.running = true
    this.schedule()
  }

  /**
   * Stop the trigger
   */
  stop() {
    this.clear()

    assign(this.state, {
      running: false
    })
  }

  protected constructor(
    interval: number,
    autostart: boolean = true,
    mode: "manual" | "auto" = "auto"
  ) {
    this.state = {
      running: autostart,
      timeout: null,
      executeDeferred: null,
      mode,
      interval
    }

    if (autostart) {
      this.schedule()
    }

    // if (import.meta.webpackHot) {
    //   import.meta.webpackHot.addDisposeHandler(() => {
    //     this.clear()
    //   })
    // }
  }
}
