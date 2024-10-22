import { AbstractScheduledTrigger } from "./AbstractScheduledTrigger"

export class SimpleScheduledTrigger extends AbstractScheduledTrigger {
  /**
   * Wrapped trigger impl
   *
   * @returns {any}
   * @protected
   */
  protected execute() {
    return this.fn()
  }

  constructor(
    readonly fn: () => any | Promise<any>,
    interval: number
  ) {
    super(interval)
  }

  /**
   * Create a simple trigger
   *
   * @param {number} every
   * @param {() => any} execute
   * @returns {SimpleScheduledTrigger}
   */
  static at(every: number, execute: () => any) {
    return new SimpleScheduledTrigger(execute, every)
  }
}
