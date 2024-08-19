import { MapKey, MapValue } from "../Types"
import { getOrSet } from "./getOrSet"
import _groupBy from "lodash/groupBy"
import { match } from "ts-pattern"
import { instanceOf, isArray } from "@3fv/guard"
import { thrower } from "vrkit-app-common/utils"

export type GroupByCollectionIteratee<T> =
  | keyof T
  | (T extends {} ? (o: T) => any : never)

export type GroupedByKey<
  T,
  I extends GroupByCollectionIteratee<T>
> = I extends keyof T ? T[I] : I extends (o: T) => infer R ? R : never

export type GroupedByObjectKey<
  T,
  I extends GroupByCollectionIteratee<T>
> = GroupedByKey<T, I> extends string | number | symbol
  ? GroupedByKey<T, I>
  : never

// export type GroupedByValue<T, I extends ValueIteratee<T>> = I extends (keyof T) ? T[I] :
//   I extends (o: T) => infer R ? R : never

export type GroupedByCollection<T, I extends GroupByCollectionIteratee<T>> = {
  [K in GroupedByObjectKey<T, I>]: T[]
}

export type GroupByMapIteratee<M extends Map<any, any>> = M extends Map<
  infer K,
  infer V
>
  ? keyof V | (V extends {} ? (o: V, key: K) => any : never)
  : never

export type GroupedByMapKey<
  M extends Map<any, any>,
  I extends GroupByMapIteratee<M>
> = M extends Map<infer K, infer V>
  ? I extends keyof V
    ? V[I]
    : I extends (o: V, key: K) => infer R
    ? R
    : never
  : never

export type GroupedByObjectMapKey<
  M extends Map<any, any>,
  I extends GroupByMapIteratee<M>
> = M extends Map<infer K, infer V>
  ? GroupedByMapKey<M, I> extends string | number | symbol
    ? GroupedByMapKey<M, I>
    : never
  : never

export type GroupedByMap<
  M extends Map<any, any>,
  I extends GroupByMapIteratee<M>
> = Map<GroupedByObjectMapKey<M, I>, Map<MapKey<M>, MapValue<M>>>
//
// interface GroupBy {
//   <T, I extends GroupByCollectionIteratee<T>>(
//     collection: T[],
//     iteratee?: I
//   ): GroupedByCollection<T, I>
//   <
//     M extends Map<any, any>,
//     I extends GroupByMapIteratee<M> = GroupByMapIteratee<M>
//   >(
//     map: M,
//     accessor: I
//   ): GroupedByMap<M, I>
// }

export function groupBy<T, I extends GroupByCollectionIteratee<T>>(
  collection: T[],
  iteratee?: I
): GroupedByCollection<T, I>
export function groupBy<
  M extends Map<any, any>,
  I extends GroupByMapIteratee<M> = GroupByMapIteratee<M>
>(map: M, accessor: I): GroupedByMap<M, I>
export function groupBy(
  src: Map<any, any> | any[],
  accessor: (...args: any[]) => any
): any {
  return match(src)
    .when(instanceOf(Map), (map: Map<any, any>) => {
      const newMap = new Map<any, any>()

      map.forEach((value, k) => {
        const nk = accessor(value)
        const part = getOrSet(newMap, nk, () => new Map<any, any>())
        part.set(k, value)
      })

      return newMap
    })
    .when(isArray, list => _groupBy(list, accessor))
    .otherwise(thrower(`Unknown src type, Map and array supported`))
}
