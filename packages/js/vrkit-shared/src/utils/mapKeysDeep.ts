import { isPlainObject, mapKeys, mapValues } from "lodash"

export function mapKeysDeep(
  obj: any,
  cb: Function,
  isRecursive: boolean
): any {
  if (!obj && !isRecursive) {
    return {}
  }

  if (!isRecursive) {
    if (
      typeof obj === "string" ||
      typeof obj === "number" ||
      typeof obj === "boolean"
    ) {
      return {}
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => mapKeysDeep(item, cb, true))
  }

  if (!isPlainObject(obj)) {
    return obj
  }

  const result = mapKeys(obj, cb)

  return mapValues(result, value =>
    mapKeysDeep(value, cb, true)
  )
}
