import type { ClassConstructor } from "@3fv/guard"
import type { CamelCase } from "./string"
//import { Pair } from "./collections"

export type StringMap<V = string> = { [key: string]: V }

export type StringOrNumber = string | number

export type Nullable<T> = T | undefined | null
export type Filter<T> = (value: T) => boolean

export type FunctionOrValue<T> = (() => T) | T | null

export type Omit<T, K extends keyof T> = Pick<
  T,
  Exclude<keyof T, K>
>


export type ClassConstructorProducer<T extends {} = any> =
  () => ClassConstructor<T>

export type ObjectValuesType<O> = O extends {
  [k in keyof any]: infer T
}
  ? Array<T>
  : never
export type ArrayItemType<A extends readonly any[] | any[]> =
  A extends Array<infer T> ? T : never

export type PromiseReturnType<Fn> = Fn extends (
  ...args: any[]
) => any
  ? ReturnType<Fn> extends Promise<infer T>
    ? T
    : never
  : never

export type AnyConstructor = new (...args: any[]) => any
export type AnyJson<T> = Partial<T> | string | Buffer | {}

export type MappedCamelCaseAttribute<T, K> = K extends string
  ? K extends keyof T
    ? CamelCase<K>
    : never
  : never

export type MappedCamelCaseAttributes<T extends {}, Keys extends (keyof T)[]> = {
  [K in Keys as MappedCamelCaseAttribute<T, K>]: any
}

export type MapValue<T> = T extends Map<any, infer V> ? V : never

export type MapKey<T> = T extends Map<infer K, any> ? K : never

export type KeysStartingWith<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${string}` ? K : never]: T[K];
};

export type ObjectKeysOfValueType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}

export type KeysWithValueType<T, V> = keyof ObjectKeysOfValueType<T,V>
