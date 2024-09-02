import { isObject, isString } from "@3fv/guard"
import { lowerFirst } from "lodash"

export function objectKeysLowerFirstReviver(key, value) {
  if (isObject(value)) {
    return Object.entries(value)
        .reduce((newValue, [k,v]) => {
          if (isString(k))
            newValue[lowerFirst(k)] = v
          else
            newValue[k] = v
          return newValue
        }, {} as any)
  }
  
  return value
}