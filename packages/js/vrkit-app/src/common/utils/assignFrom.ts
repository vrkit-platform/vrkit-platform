import { cloneDeep } from "lodash"

export function assignFrom<T extends object = any>(
  from: Partial<T>,
  to: T
): T {
  return Object.assign(to, cloneDeep(from))
}
