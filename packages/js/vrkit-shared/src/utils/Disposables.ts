import { guard, isFunction } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)

export class Disposables extends Array {
  constructor() {
    super()
  }

  dispose() {
    this.forEach(disposer => {
      asOption(disposer)
        .filter(isFunction)
        .ifSome(disposer =>
          guard(
            () => disposer(),
            err =>
              log.error("Unable to dispose cleanly", err)
          )
        )
    })

    this.length = 0
  }
  
  [Symbol.dispose]() {
    this.dispose()
  }
}
