import { Tuple2 } from "@3fv/prelude-ts"

export type TupleToMapFn = <
  K extends string | number | symbol,
  V
>(
  record: Record<K, V>,
  tuple: Tuple2<K, V>
) => Record<K, V>

export function tupleToMap<
  K extends string | number | symbol,
  V
>(initialValue: Record<K, V> = {} as Record<K, V>) {
  return (
    record: undefined | Record<K, V>,
    tuple: Tuple2<K, V>
  ): Record<K, V> => ({
    ...((record || initialValue || {}) as Record<K, V>),
    [tuple.fst()]: tuple.snd()
  })
}
