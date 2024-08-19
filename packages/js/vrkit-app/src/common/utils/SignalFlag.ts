import { isFunction } from "@3fv/guard"
import { EventEmitter3Async } from "./events"
import { Bind } from "./decorators"

interface SignalFlagEvents {
  changed: (value: boolean, flag: SignalFlag) => any
  used: (flag: SignalFlag) => any
  unused: (flag: SignalFlag) => any
}

type SignalFlagInitialValue = boolean | (() => boolean)

export class SignalFlag extends EventEmitter3Async<SignalFlagEvents> {
  /**
   * Value  of signal flag
   */
  private value: boolean

  /**
   *
   * @param newValue
   * @returns signal
   */
  @Bind
  set(newValue: boolean) {
    if (this.value !== newValue) {
      this.value = newValue
      this.emit("changed", newValue, this)
      this.emit(newValue ? "used" : "unused", this)
    }
    return this
  }

  /**
   * Reset signal to unused
   *
   * @returns signal
   */
  @Bind
  reset() {
    return this.set(false)
  }

  /**
   * Toggle the signal
   *
   * @returns signal
   */
  @Bind
  toggle() {
    return this.set(!this.value)
  }

  /**
   * Gets whether is used
   */
  get inUse() {
    return this.value === true
  }


  /**
   * Gets whether is unused
   */
  get isUnused() {
    return this.value === true
  }

  /**
   * Create signal flag
   *
   * @param initialValue of flag
   */
  private constructor(initialValue: SignalFlagInitialValue = false) {
    super()
    this.set(isFunction(initialValue) ? initialValue() : initialValue === true)
  }

  static new(initialValue: SignalFlagInitialValue = false) {
    return new SignalFlag(initialValue)
  }
}


/**
 * Signals flag creator
 *
 * @param [initialValue]
 * @returns
 */
export function signalFlag(initialValue: SignalFlagInitialValue = false) {
  return SignalFlag.new(initialValue)
}
