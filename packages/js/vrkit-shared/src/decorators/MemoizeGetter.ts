import {
  ClassConstructor,
  isArray,
  isFunction,
  isString
} from "@3fv/guard"
import { Predicate } from "@3fv/prelude-ts"
import { match } from "ts-pattern"
import { shallowEqualsArrayOrList ,arrayOf, thrower } from "../utils"

const isArrayOrString = Predicate.of(isArray).or(isString)

type OneOrMoreKeysOf<T extends {}> = keyof T | (keyof T)[]

function propertyValuesMatcher<T extends {}>(
  keyOrKeys: OneOrMoreKeysOf<T>
): (o: T) => boolean {
  const keys = arrayOf(keyOrKeys) as (keyof T)[]

  let values = Array<any>(keys.length)
  return function(o: T) {
    const newValues = keys.map(key => o[key])
    if (!shallowEqualsArrayOrList(values, newValues)) {
      values = newValues
      return false
    } else {
      return true
    }
  }
}

export function MemoizeGetter<T extends {}>(
  invalidateCriteriaOrPredicate: OneOrMoreKeysOf<T> | ((o: T) => any)
) {
  const areValuesEqual = match(invalidateCriteriaOrPredicate)
    .when(isArrayOrString, (criteria: OneOrMoreKeysOf<T>) =>
      propertyValuesMatcher<T>(criteria)
    )
    .when(isFunction, (fn: (o: T) => any) => {
      let value:any = null
      return function(o:T) {
        const newValue = fn.apply(this, [o])
        if (newValue !== value) {
          value = newValue
          return false
        } else {
          return true
        }
      }
    })
    .otherwise(thrower(`Unknown criteria type`))

  return (
    ctor: ClassConstructor<T>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    let currentValue: any = undefined
    const get = (thiz: any) => {
      currentValue = descriptor.get.apply(thiz, [])
      return currentValue
    }
    return {
      ...descriptor,
      //value: undefined,
      get: function () {
        if (areValuesEqual.apply(this,[this])) {
          return currentValue
        } else {
          return get(this)
        }
      }
    }
  }
}
