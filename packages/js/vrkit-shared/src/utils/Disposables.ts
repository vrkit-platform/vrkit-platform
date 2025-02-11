import { guard, isFunction } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)

type Disposer = (() => any) & {
  dispose?: () => any
}

export class Disposables extends Array<Disposer> {
  #destroyed = false

  /**
   * Checks if the current object has been destroyed.
   *
   * @return {boolean} Returns true if the object is destroyed; otherwise,
   *     false.
   */
  get isDestroyed(): boolean {
    return this.#destroyed
  }

  constructor() {
    super()
  }

  /**
   * Adds one or more items to the end of the list, unless the list is marked
   * as destroyed.
   *
   * @param {...Disposer} items - One or more items to add to the list.
   * @return {number} The new length of the list after the items are added.
   *     Returns 0 if the list is destroyed.
   */
  push(...items: Disposer[]): number {
    if (this.#destroyed) {
      log.warn("Can not push disposers to a destroyed list")
      return 0
    }
    return super.push(...items)
  }

  /**
   * Cleans up and disposes of all items in the current collection.
   * It sequentially executes disposer functions or methods associated with the
   * items. If any issues occur during disposal, they are logged without
   * halting execution.
   *
   * @return {void} This method does not return a value.
   */
  dispose(): void {
    if (this.#destroyed) return

    this.#destroyed = true

    const disposers = this.splice(0, this.length)
    disposers.forEach(disposer => {
      asOption(disposer)
        .map(disposer => [(disposer as any).dispose, disposer].filter(isFunction))
        .ifSome(allDisposers =>
          guard(
            () => allDisposers.forEach(fn => fn()),
            err => log.error("Unable to dispose cleanly", err)
          )
        )
    })

    log.assert(!this.length, `Disposables is not empty (${this.length})`)
  }

  [Symbol.dispose]() {
    this.dispose()
  }
}
