import { isArray, isObject } from "@3fv/guard"
import type { Pair } from "./collections"
import { entriesOf, EntryOf } from "./ObjectUtil"
import type { ArrayItemType } from "./Types"


export function filterPropertyValues<Args extends any[]>(...testValues: Args) {
  return (value: ArrayItemType<Args>) => testValues.includes(value)
}

export type MapEntryAsPair<M extends Map<any, any>> = M extends Map<
  infer K,
  infer V
>
  ? Pair<K, V>
  : never

export function filterMap<K, V, M extends Map<K, V> = Map<K, V>>(
  map: M,
  predicate: (pair: Pair<K, V>) => boolean
): M {
  return new Map([...map.entries()].filter(predicate)) as M
}

export function filterObject<
  O extends {}
>(o: O, predicate: (pair: EntryOf<O>) => boolean): Partial<O> {
  return Object.fromEntries(
    entriesOf(o)
      .filter(predicate as any)
      .map(([key, value]) => [
        key,
        isArray(value as any)
          ? (value as any).map(subValue =>
              filterObject(subValue, predicate as any)
            )
          : isObject(value)
          ? filterObject(value, predicate as any)
          : value
      ])
  ) as Partial<O>
}
export function filterUndefinedProps<O extends {}>(o: O): O {
  return filterObject(o, ([, v]) => typeof v !== "undefined") as O
}
export function filterNullishProps<O extends {}>(o: O): O {
  return filterObject(o, ([, v]) => ![undefined, null].includes(v)) as O
}
