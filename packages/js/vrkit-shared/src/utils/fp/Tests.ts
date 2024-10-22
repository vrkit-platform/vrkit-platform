import { ClassConstructor, isDefined, isFunction, isNumber } from "@3fv/guard"
import { negate, get as _get } from "lodash"
import { asOption } from "@3fv/prelude-ts"
import {
  getFunctionOrValue,
  isNotEmptyString,
  isPrimitiveName,
  PrimitiveName
} from "../ObjectUtil"
import { Identity } from "../Identity"
import { AnyConstructor } from "../Types"

export const digitsOnly = (val: string | number) =>
  isNumber(val) || /^\d+$/.test(val)

export const isNotUndefined = <T>(o: T | undefined): o is T => {
  return o !== undefined
}

export const greaterThan = (gt: number) => (test: number) => test > gt

export const greaterThanEqual =
  (gte: number) =>
  (test: number): boolean =>
    test >= gte

export const lessThan = (lt: number) => (test: number) => test < lt

export const lessThanEqual =
  (lte: number) =>
    (test: number): boolean =>
      test <= lte


/**
 * Get a direct or deep property (uses lodash get)
 * and compare it to the provided value
 *
 * @function
 * @template T
 * @template P
 * @param {P} prop
 * @param {T[P]} value
 * @returns {(o: T) => boolean}
 */
export const propEqualTo =
  <T, P extends keyof T = keyof T>(prop: P, value: T[P]) =>
  (o: T) =>
    _get(o, prop) === value

/**
 * Predicate for property at path
 * equality check, uses lodash, so
 * property notation is simple and
 * can be deep
 *
 * @template V
 * @param {string} path
 * @param {V} value
 * @returns {(o: T) => boolean}
 */
export const propertyPathEquals =
  <V, T extends {} = any>(path: string, value: V) =>
  (o: T): boolean =>
    _get(o, path) === value

/**
 * Negates `propEqualTo`
 *
 * @template P
 * @param {P} prop
 * @param {T[P]} value
 * @returns {<T>(args: T) => boolean}
 */
export const propNotEqualTo = <T, P extends keyof T = keyof T>(
  prop: P,
  value: T[P]
) => negate(propEqualTo(prop, value))

export const propIn =
  <T, P extends keyof T = keyof T>(prop: P, values: Array<T[P]>) =>
  (o: T) =>
    values.includes(o[prop])

export const propNotIn = <T, P extends keyof T = keyof T>(
  prop: P,
  values: Array<T[P]>
) => negate(propIn(prop, values))

export const equalTo =
  <T>(test: T) =>
  (value: T) =>
    test === value

export const notEqualTo =
  <T>(test: T) =>
  (value: T) =>
    test !== value

export const isTrue = (value: boolean) => value === true

export function matchOrElse<T, F = T | undefined>(
  test: boolean | (() => boolean),
  truthy: T | (() => T),
  falsey: F | (() => F) = undefined
): T | F {
  const isTruthy: any = isFunction(test) ? test() : test
  return isDefined(isTruthy) && isTruthy !== false && isTruthy !== 0
    ? isFunction(truthy)
      ? truthy()
      : truthy
    : isFunction(falsey)
    ? falsey()
    : falsey
}

export const hasPropOfType =
  <
    T extends {},
    Prop extends keyof T,
    V extends T[Prop] = T[Prop],
    CtorOrTypename extends
      | ClassConstructor<T[Prop]>
      | PrimitiveName = ClassConstructor<T[Prop]>
  >(
    prop: Prop,
    type: CtorOrTypename
  ) =>
  (target: T): boolean =>
    asOption(target[prop])
      .map(value =>
        isPrimitiveName(type)
          ? typeof value === type
          : value instanceof (type as AnyConstructor)
      )
      .getOrElse(false)

export const hasProp =
  <T, Prop extends keyof T>(prop: Prop) =>
  (target: T): boolean =>
    !!target[prop]

export const hasProps =
  <T, K extends keyof T>(...props: K[]) =>
  (target: T): boolean =>
    props.map(prop => target[prop]).every(Boolean)

export const doesNotHaveProp =
  <T, Prop extends keyof T>(prop: Prop) =>
  (target: T): boolean =>
    [null, undefined].includes(target[prop])

export const doesNotHaveProps =
  <T, K extends keyof T>(...props: K[]) =>
  (target: T): boolean =>
    !props.map(prop => target[prop]).some(Boolean)

export function constrainedValue<T>(
  value: T,
  constraint: (value: T) => boolean,
  errorMessage: (() => string) | string = "Required value missing"
): Omit<T, null | undefined> {
  return asOption(value)
    .filter(constraint)
    .match({
      None: () => {
        throw getFunctionOrValue(errorMessage)
      },
      Some: Identity
    })
}

export function requiredValue<T>(
  value: T,
  errorMessage: (() => string) | string = "Required value missing"
): NonNullable<T> {
  return asOption(value).getOrThrow(
    getFunctionOrValue(errorMessage)
  ) as NonNullable<T>
}

export function requiredNotEmpty<T extends string>(
  value: T,
  errorMessage: (() => string) | string = "Required value missing"
): Exclude<T, null | undefined> {
  return asOption(value)
    .filter(isNotEmptyString)
    .getOrThrow(getFunctionOrValue(errorMessage)) as Exclude<
    T,
    null | undefined
  >
}
