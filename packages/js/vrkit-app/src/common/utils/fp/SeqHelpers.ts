import {
  HasEquals,
  Option,
  Predicate,
  Vector
} from "@3fv/prelude-ts"
import { negate } from "lodash"
import { instanceOf, isArray } from "@3fv/guard"
import { isNotEmpty } from "../ObjectUtil"

export const inListWithEquals = <T extends HasEquals>(
  list: Array<T> | Vector<T>
): ((o: T) => boolean) => {
  const srcList =
    list instanceof Vector ? list : Vector.ofIterable(list)
  return (o: T) => srcList.contains(o)
}
export const notInListWithEquals = <T extends HasEquals>(
  list: Array<T> | Vector<T & HasEquals>
): ((o: T) => boolean) => negate(inListWithEquals(list))

export const inList =
  <T>(
    list: Array<T> | Vector<T & HasEquals>
  ): ((o: T) => boolean) =>
  (o: T) =>
    Array.isArray(list)
      ? list.includes(o)
      : list.contains(o as T & HasEquals)

export const notInList = <T>(
  list: Array<T> | Vector<T & HasEquals>
): ((o: T) => boolean) => negate(inList(list))

export const iteratorComparePropEqualFilter =
  <T extends {}, Prop extends keyof T>(
    inList: Array<T>,
    prop: Prop
  ) =>
  (o: T) =>
    !!o && inList.some(o2 => !!o2 && o2[prop] === o[prop])

// export const isSeq = Predicate.of<any>(isArray)
//   .or(instanceOf(Vector as any)) as unknown as (o:any) => o is (Vector<any> | Array<any>)
//
export const isNotEmptyArray =
  Predicate.of(isArray).and(isNotEmpty)
