import type { ToString } from "./toString"
import { objectToString } from "./objectToString"

export const mixinToString = <T extends ToString>(o:T):T => {
  Object.defineProperty(o, "toString", {
    writable: false, enumerable: false, configurable: false, value: objectToString
  })

  return o
}
