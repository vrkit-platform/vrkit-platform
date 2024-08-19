import { isEmpty, keysOf } from "./ObjectUtil"
import { uniq } from "lodash"

export type ObjectPropertyDiff<
  O extends {} = any,
  K extends keyof O = keyof O,
  V extends O[K] = O[K]
> = [K, V, V]

export type ObjectDiff<
  O extends {} = any,
  K extends keyof O = keyof O,
  V extends O[K] = O[K]
> = {
  match: boolean
  diffProps: Array<ObjectPropertyDiff<O, K, V>>
}

export function objectDiff<
  O extends {} = any,
  K extends keyof O = keyof O,
  V extends O[K] = O[K]
>(
  o1: O,
  o2: O,
  exportKeys: Array<K> = uniq([
    ...keysOf(o1),
    ...keysOf(o2)
  ]) as Array<K>
): ObjectDiff<O, K, V> {
  const diffProps = exportKeys
    .map(
      key =>
        [key, o1[key], o2[key]] as ObjectPropertyDiff<
          O,
          K,
          V
        >
    )
    .filter(([, v1, v2]) => v1 !== v2)

  return {
    match: isEmpty(diffProps),
    diffProps
  }
}
