// noinspection TypeScriptSuspiciousConstructorParameterAssignment

import { GlobalKeys, ActionDefaultAccelerator } from "./ActionTypes"
import {
  ModifiedKeyNames,
  MappedKeys,
  ElectronMappedKeys
} from "./ActionAcceleratorConstants"

import { isNumber } from "@3fv/guard"
import { pick } from "lodash"
import { arrayOf } from "../../utils"

export function isKeyboardEvent(o: any): o is KeyboardEvent {
  return typeof KeyboardEvent === "undefined"
    ? false
    : o &&
        (o instanceof KeyboardEvent || (o.type && o.type.indexOf("key") > -1))
}

/**
 * Command accelerator configuration
 */
export class ActionAccelerator {
  static create(str: string) {
    return new ActionAccelerator(str)
  }

  /**
   * Accelerator comparator
   *
   * @param accelerator
   * @param event
   * @returns {any}
   */

  static matchToEvent(
    accelerators: ActionDefaultAccelerator | ActionDefaultAccelerator[],
    event: KeyboardEvent
  ) {
    if (!accelerators || !event) return false

    return arrayOf(accelerators).some(accelerator => {
    const accel = new ActionAccelerator(accelerator),
      keyAccel = new ActionAccelerator(event)

    return accel.isEqual(keyAccel)
  })
  }


  /**
   * Create a new accelerator instance
   *
   * @param acceleratorArg
   */
  constructor(readonly acceleratorArg: ActionDefaultAccelerator | KeyboardEvent) {
    if (!acceleratorArg) return

    // IF KEYBOARD EVENT
    if (isKeyboardEvent(acceleratorArg)) {
      this.addPart(acceleratorArg.code)
      Object.assign(
        this,
        pick(acceleratorArg, "ctrlKey", "altKey", "metaKey", "shiftKey")
      )
    } else {
      if (isNumber(acceleratorArg))
        acceleratorArg = GlobalKeys[acceleratorArg]

      this.acceleratorArg = acceleratorArg.toLowerCase().replace(/\s/g, "")
      this.acceleratorArg.split("+").forEach(part => this.addPart(part))
    }
  }


  /**
   * Convert generic accelerator to election accelerator
   *
   * @param {ActionDefaultAccelerator} accel
   * @return {string}
   */
  static toElectron(accel:ActionDefaultAccelerator) {
    return new ActionAccelerator(accel).toElectron()
  }

  /**
   * All non modifier key codes
   */
  codes: string[] = []

  /**
   * Ctrl key
   */
  ctrlKey: boolean = false

  /**
   * Super key
   */
  metaKey: boolean = false

  /**
   * Shift key
   */
  shiftKey: boolean = false

  /**
   * Alt key
   */
  altKey: boolean = false

  /**
   * Has any modified
   */
  get hasModifier() {
    return this.hasNonInputModifier || this.shiftKey
  }

  /**
   * Has non-input modifier (No shift)
   */
  get hasNonInputModifier() {
    return this.ctrlKey || this.metaKey || this.altKey
  }

  /**
   * Add another part of the accelerator
   *
   * @param code
   */
  private addPart(code: string) {
    if (code) {
      //code.toLowerCase()
      code = (MappedKeys[code] || MappedKeys[code.toLowerCase()] || code)
        .replace(/^Key/i, "")
        .toLowerCase()
        .replace(/digit/, "")

      if (ModifiedKeyNames.includes(code)) this[`${code}Key`] = true
      else this.codes.push(code)
    }
  }


  /**
   * Map to electron accelerator string
   *
   * @returns {string}
   */
  toElectron(): string {
    return !this.codes.length
      ? ""
      : ModifiedKeyNames.filter(modKey => this[`${modKey}Key`])
          .map(modKey => ElectronMappedKeys[modKey])
          .concat(
            this.codes.map((code: string) => {
              const electronKey = Object.keys(ElectronMappedKeys).find(
                (key: string) => {
                  return key.toLowerCase() === code.toLowerCase()
                }
              ) as string | null

              return electronKey
                ? ElectronMappedKeys[electronKey]
                : code.toUpperCase()
            })
          )
          .join("+")
  }

  /**
   * Compare to accelerators
   *
   * @param o
   */
  isEqual(o: ActionAccelerator) {
    const myCodes = this.codes.map(code => code.toLowerCase()),
      oCodes = o.codes.map(code => code.toLowerCase())

    return (
      ["ctrlKey", "altKey", "metaKey", "shiftKey"].every(
        key => this[key] === o[key]
      ) && myCodes.every(it => oCodes.includes(it))
    )
  }


}
