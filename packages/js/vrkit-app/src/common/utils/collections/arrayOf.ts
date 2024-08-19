import { flatten } from "lodash"


export function arrayOf<T>(
  ...items: Array<T | Array<T>>
): Array<T> {
  return flatten(items)
}
