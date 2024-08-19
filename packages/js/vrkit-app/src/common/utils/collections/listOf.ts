import { Vector } from "@3fv/prelude-ts"

export function listOf<T>(...items: Array<T>): Vector<T> {
  return Vector.of(...items)
}
