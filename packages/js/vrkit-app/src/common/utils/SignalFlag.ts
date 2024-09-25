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
   * Swap a value for the current value
   *
   * @param newValue
   */
  swap(newValue: boolean): boolean {
    const currentValue = this.value
    this.set(newValue)
    return currentValue
  }
  /**
   * Set the flag to to a specific value (default new value is `true`)
   *
   * @param newValue
   * @returns signal
   */
  @Bind
  set(newValue: boolean = true) {
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

  get isSet() {
    return this.inUse
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
  constructor(initialValue: SignalFlagInitialValue = false) {
    super()
    this.set(isFunction(initialValue) ? initialValue() : initialValue === true)
  }
  
  /**
   * Static access to constructor
   *
   * @param initialValue
   */
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
