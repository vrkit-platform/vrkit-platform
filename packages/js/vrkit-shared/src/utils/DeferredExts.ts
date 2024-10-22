import { Deferred } from "@3fv/deferred"
import { isFunction, isPromise } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"
import { TimeoutError } from "bluebird"
import { invoke } from "./fp"

const log = getLogger(__filename)
const { debug } = log
type ClearTimeoutFn = () => void
const clearTimeouts = new Set<ClearTimeoutFn>()

export function clearAllTimeouts() {
  clearTimeouts.forEach(invoke)
}

type TimeoutPromiseHandler<T = any> = (
  deferred: Deferred<T>
) => Promise<T>
function timeoutPromiseHandler<T>(
  deferred: Deferred<T>,
  fn: TimeoutPromiseHandler<T>
) {
  return () => {
    if (!deferred.isSettled()) {
      fn(deferred)
    }

    return deferred.promise
  }
}

export function deferredInvokeAfter<T>(
  deferred: Deferred<T>,
  timeoutMs: number,
  fn: (deferred: Deferred<T>) => Promise<T>
): Promise<T> {
  // TIMEOUT HANDLER
  const timeoutFn = timeoutPromiseHandler<T>(
    deferred,
    deferred => {
      const result = fn(deferred)

      return isPromise(result)
        ? result.then(() => deferred.promise)
        : deferred.promise
    }
  )

  // TIMEOUT REF
  const ref = setTimeout(timeoutFn, timeoutMs)

  // CLEAR TIMEOUT
  const clearFn: ClearTimeoutFn = () =>
    ref && clearTimeout(ref)

  // CLEANUP RESOURCES
  const finallyFn = () => {
    if (!isFunction(clearFn)) {
      return
    }

    clearFn()
    clearTimeouts.delete(clearFn)
  }

  // ADD TO TIMEOUT LIST
  clearTimeouts.add(clearFn)

  // ATTACH TO FINALLY
  return deferred.promise.finally(finallyFn)
}

/**
 * Create a timeout for provided `Deferred` `value`
 *
 * @param {Deferred<T>} deferred
 * @param {number} timeoutMs
 * @param {string} msg
 * @returns {Promise<T>}
 */
export function setDeferredTimeout<T>(
  deferred: Deferred<T>,
  timeoutMs: number,
  msg: string = `deferred promise timedout after ${timeoutMs}ms`
): Promise<T> {
  // TIMEOUT HANDLER
  const timeoutFn = (deferred: Deferred<T>) => {
    if (!deferred.isSettled()) {
      if (log.isTraceEnabled()) {
        debug(msg)
      }
      deferred.reject(new TimeoutError(msg))
    }

    return deferred.promise
  }

  return deferredInvokeAfter<T>(
    deferred,
    timeoutMs,
    timeoutFn
  )
}
