import { assert as guardAssert, getValue, isArray, isFunction, isNil, isString } from "@3fv/guard"

import { getLogger } from "@3fv/logger-proxy"
import {
  assign,
  clone as _cloneShallow,
  cloneDeep as _cloneDeep,
  defaults as _defaults,
  fromPairs,
  get as _get,
  isEqual as _isEqual,
  isObject as _isObject,
  mapValues as _mapValues,
  negate as _negate,
  ObjectIterator,
  pick as _pick
} from "lodash"

import { asOption } from "@3fv/prelude-ts"
import { Pair } from "./collections/pairOf"
import {
  ClassConstructorWithPartial,
  isMessageTypeClassConstructor,
  MessageTypeClassConstructor
} from "./ClassConstructorWithPartial"

export type Primitives = number | boolean | string | undefined | null | symbol | bigint

export type PrimitiveTypes = keyof Primitives // QuotedLiterals<Primitives>

export type PrimitiveName = "number" | "boolean" | "string" | "undefined" | "null" | "symbol" | "bigint"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export const defaults = _defaults as <T>(target: T, values: Partial<T>) => T

export type DefaultProducer<T, K> = K extends keyof T ? () => T[K] : never

export type DefaultKeyProducer<T, K extends keyof T = keyof T> = [K, DefaultProducer<T, K>]

export function defaultWithProducers<T extends {}>(target: T, producers: Partial<{ [K in keyof T]: () => T[K] }>) {
  if (target) {
    entriesOf(producers)
      .filter(([key]) => [null, undefined].includes(target[key]))
      .forEach(([key, producer]: any) => {
        target[key] = producer()
      })
  }
  return target
}

export function transform<T, Fn extends (value: T) => any>(value: T, fn: Fn): ReturnType<Fn> {
  return fn(value)
}

export const PrimitiveNames = Array<PrimitiveName>(
  "number",
  "boolean",
  "string",
  "undefined",
  "null",
  "symbol",
  "bigint"
)

export function isPrimitiveName(name: any): name is PrimitiveName {
  return PrimitiveNames.includes(name)
}

export const mapValuesDeep = <T extends object, TResult = T>(v: T, callback: ObjectIterator<T, TResult>): TResult =>
  (isArray(v)
    ? v.map(nv => callback(nv, null, v))
    : _isObject(v)
      ? _mapValues(v, (v, k) => mapValuesDeep(v as any, callback))
      : callback(v, null, v)) as any

export function clearArray<T>(arr: Array<T>): Array<T> {
  return arr.splice(0, arr.length)
}

export function safePush<T>(arr: Array<T>, value: T): Array<T> {
  return (arr || []).filter(it => it !== value).concat([value])
}

export function hasOwnProps(o: any, ...props: string[]): boolean {
  return o && props.every(prop => o.hasOwnProperty(prop))
}

/**
 * Object cloning wrapper with some special extras
 * - copies typestore $$docs value
 * - copies explicit ids
 *
 * @param o
 * @param newSources
 * @returns {any}
 */
export function cloneObject<T>(o: T, ...newSources: Array<Partial<T>>): T {
  return assign(_cloneDeep(o), ...newSources)
}

/**
 * Shallow clone object and assign properties
 *
 * @param o
 * @param newSources
 */
export function cloneShallow<T extends object>(o: T, ...newSources: Array<Partial<T>>): T {
  return assign(_cloneShallow(o), ...newSources) as T
}

export function cloneDeep<T extends object>(o: T, ...newSources: Array<Partial<T>>): T {
  return assign(_cloneDeep(o), ...newSources) as T
}

export function cloneInstanceOf<T extends {}>(
  ctor: ClassConstructorWithPartial<T> | MessageTypeClassConstructor<T>,
  o: T,
  ...newSources: Array<Partial<T>>
): T {
  return isMessageTypeClassConstructor(ctor)
    ? assign(ctor.clone(o), ...newSources)
    : (assign(new ctor(), _cloneDeep(o), ...newSources) as T)
}

export function mixin<T extends object, Mixins extends any[]>(
  o: T,
  ...mixins: Mixins
): T & (Mixins extends [...args: infer M] ? M : unknown) {
  return Object.assign(cloneShallow(o), ...mixins)
}

/**
 * Shallow equal an array or list
 *
 * @param val1
 * @param val2
 * @param props
 * @returns {boolean}
 */
export function shallowEqualsArrayOrList<
  T extends object = any,
  A extends Array<T> = Array<T>,
  K extends keyof T = any
>(val1: A, val2: A, ...props: K[]): boolean {
  if (!val1 || !val2 || !Array.isArray(val1) || !Array.isArray(val2) || val1.length !== val2.length) {
    return false
  }

  if (val1.length === 0 && val2.length === 0) return true

  return val1.every((testVal1, index) => {
    const testVal2 = val2[index]

    return !props.length ? testVal1 === testVal2 : shallowEquals(testVal1, testVal2, ...(props as any))
  })
}

/**
 * Shallow equal a specific property key for two objects
 *
 * @param o1
 * @param o2
 * @param key
 * @returns {boolean}
 */
export function shallowEqualsProp<T extends object = any, P extends KeysOf<T> = KeysOf<T>>(
  o1: T,
  o2: T,
  key: P
): boolean {
  const val1 = _get(o1, key),
    val2 = _get(o2, key)

  return val1 === val2 || shallowEqualsArrayOrList(val1 as any, val2)
}

const areLengthsEqual = <Items extends any[]>(arr1: Items, arr2: Items) =>
  !!arr1 && !!arr2 && arr1.length === arr2.length

export type ValuesOf<T extends {}> =
  T extends Map<any, infer V> ? V : T extends { [key in keyof any]: infer V } ? V : never

export function valuesOf<
  T extends object,
  V extends T extends Map<any, infer V> ? V : T extends { [key in keyof any]: infer V } ? V : never
>(o: T): Array<V> {
  return !o ? [] : o instanceof Map ? [...o.values()] : Object.values(o)
}

export type EntriesOf<O extends {}> = Array<[keyof O, ValuesOf<O>]>

export type EntryOf<O extends {}> = Pair<keyof O, ValuesOf<O>>

export function entriesOf<O extends {}>(o: O): EntriesOf<O> {
  return Object.entries(o) as EntriesOf<O>
}

export type KeysOf<T> = (T extends Map<infer K, any> ? K : T extends object ? keyof T : never) & keyof any

export function keysOf<T, K extends KeysOf<T> = KeysOf<T>>(o: T): Array<K> {
  return !o ? [] : o instanceof Map ? [...o.keys()] : (Object.keys(o) as Array<K>)
}

export function hasKeys<T extends {}>(o: T) {
  return !!o && keysOf(o).length > 0
}

/**
 * Shallow equals two objects on either all own properties - OR - specific
 * props provided
 *
 * @param {T} o1
 * @param {T} o2
 * @param {KeysOf<T>} props
 * @returns {boolean}
 */
export function shallowEquals<T extends object = any, K extends KeysOf<T> = KeysOf<T>>(
  o1: T,
  o2: T,
  ...props: KeysOf<T>[]
): boolean {
  if (o1 === o2) {
    return true
  }

  props = asOption(props)
    .filter(isNotEmpty)
    .match({
      Some: props => props,
      None: () => {
        const o1Props = !!o1 ? keysOf(o1) : null,
          o2Props = !!o2 ? keysOf(o2) : null

        return Array.isArray(o1Props) && Array.isArray(o2Props) && areLengthsEqual(o1Props, o2Props) ? o1Props : []
      }
    })
  return isNotEmpty(props) ? props.every(prop => shallowEqualsProp(o1, o2, prop)) : false
}

/**
 * Decoration wrapper
 *
 * @param name
 * @param clazz
 * @param decorator
 * @param data
 * @returns {any}
 */
export function postConstructorDecorate<T>(
  name: string,
  clazz: { new (): T },
  decorator: (instance: T, args: any[], data: any) => T,
  data: any = null
): T {
  const makeDecorator = new Function(
    "name",
    "clazz",
    "decorator",
    "data",
    `
		function ${name}() {
			clazz.apply(this,arguments);
			decorator(this,arguments,data);
		}

		${name}.prototype = clazz.prototype;
		return ${name};
	`
  )

  return makeDecorator(name, clazz, decorator, data)
}

export interface IValueTransformer {
  (key: string, val: any): any
}

export function transformValues(o, fn: IValueTransformer): any {
  return Array.isArray(o)
    ? o.map(aVal => transformValues(aVal, fn))
    : typeof o === "object"
      ? Object.keys(o).reduce((newObj: any, nextKey: any) => {
          newObj[nextKey] = fn(nextKey, o[nextKey])
          return newObj
        }, {})
      : o
}

export function extractError(error: Error): Error | null {
  let newError: Error = null
  if (error) {
    newError = _cloneDeep(_pick(error, ["message", "statusCode", "errors"])) as Error | undefined
    if (!newError.message) {
      newError.message = error.message || error.toString() || "Save failed"
    }
  }
  return newError
}

export type EnumValueMap<T, K extends keyof T & string = keyof T & string> = {
  [key in K]: T[key] & string
}

export function convertEnumValuesToString<E extends object>(enumClazz: E) {
  return fromPairs(Object.entries(enumClazz)) as EnumValueMap<E>
}

export function isEmpty(o: any): boolean {
  return isNil(o) || (!Array.isArray(o) && !isString(o)) || !(getValue(() => o.length, 0) > 0)
}

export const isNotEmpty = _negate(isEmpty)

export const isNotEmptyString = (s: any): s is string => isNotEmpty(s) && isString(s)

export function isEqual(o1: any | null | undefined, o2: any | null | undefined): boolean {
  return o1 === o2 || getValue(() => (!isFunction(o1.equals) ? false : o1.equals(o2)), false) || _isEqual(o1, o2)
}

//export function assertFilter(test)
export const assert = guardAssert
// export function assert(
//   test: (() => boolean) | boolean,
//   msg?: null | (() => string) | string | undefined
// ): void | never {
//   const text = !msg ? "No message" : isFunction(msg) ? msg() : msg
//   let result: boolean = false
//   try {
//     result = isFunction(test) ? test() : test
//   } catch (err) {
//     log.error(`Assert failed: "${test}"`, err)
//   }
//
//   if (!result) {
//     throw Error(text)
//   }
// }

export function assertDebug(msg?: null | (() => string) | string | undefined): void | never {
  assert(process.env.NODE_ENV === "development", msg)
}

export function toSnakeCase(str: string) {
  return str
    .replace(/[-\s]+/g, "_")
    .replace(/([A-Z\d]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
}

export function toDashCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, "-")
}

export function toLabelString(str: string): string {
  const newStr = str.replace(/([A-Z_])/g, g => ` ${g[0].toLowerCase()}`)
  return newStr.substring(0, 1).toUpperCase() + newStr.substring(1, newStr.length)
}

export function getFunctionOrValue<T>(valueOrFn: T | (() => T)): T {
  return isFunction(valueOrFn) ? valueOrFn() : valueOrFn
}

export function findEntry<O extends {}>(o: O, predicate: (value: ValuesOf<O>, key: KeysOf<O>) => boolean) {
  return entriesOf<O>(o).find(([k, v]) => predicate(v, k as KeysOf<O>))
}

export function findValue<O extends {}>(o: O, predicate: (value: ValuesOf<O>, key: KeysOf<O>) => boolean) {
  return entriesOf<O>(o).find(([k, v]) => predicate(v, k as KeysOf<O>))?.[1]
}

export function findKey<O extends {}>(o: O, predicate: (value: ValuesOf<O>, key: KeysOf<O>) => boolean) {
  return entriesOf<O>(o).find(([k, v]) => predicate(v, k as KeysOf<O>))?.[0]
}
